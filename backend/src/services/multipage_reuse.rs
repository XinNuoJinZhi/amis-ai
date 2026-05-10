//! 1.2.0 多页 shared/ 复用率：扫 src/pages/**.vue 统计 import 来自 ../{components,styles,api,store,utils}/ 的次数。
//!
//! 与 `sandbox/src/reuse_metrics.rs` 行为对齐，但 backend 内联实现（避免跨服务 HTTP，
//! 因为 sandbox W6.1 当时只暴露了函数没暴露 endpoint）。
//! `reuse_rate = import_count / file_count`：高于 1.0 即"平均每页有多次共享 import"。
//!
//! 不引入 regex 依赖，纯字符串扫描——足以满足"统计是否复用 shared/" 这条粗粒度需求。

use serde::Serialize;
use std::path::Path;
use walkdir::WalkDir;

#[derive(Debug, Serialize, Clone)]
pub struct ReuseMetric {
    pub import_count: usize,
    pub file_count: usize,
    pub reuse_rate: f64,
}

/// 5 个共享目录 × 2 层相对路径深度 = 10 个匹配模式。
/// 只匹配 from "../components/" / from '../components/' 这类形态，
/// 把整行包含 import + from + 任一前缀的视作一次复用 import。
const SHARED_PREFIXES: &[&str] = &[
    "../components/",
    "../../components/",
    "../styles/",
    "../../styles/",
    "../api/",
    "../../api/",
    "../store/",
    "../../store/",
    "../utils/",
    "../../utils/",
];

pub fn compute_reuse_rate(workdir: &Path) -> ReuseMetric {
    let pages_dir = workdir.join("src").join("pages");
    let mut import_count = 0usize;
    let mut file_count = 0usize;

    if pages_dir.exists() {
        for entry in WalkDir::new(&pages_dir).into_iter().filter_map(Result::ok) {
            if !entry.file_type().is_file() {
                continue;
            }
            if entry.path().extension().and_then(|s| s.to_str()) != Some("vue") {
                continue;
            }
            file_count += 1;
            let Ok(content) = std::fs::read_to_string(entry.path()) else {
                continue;
            };
            for line in content.lines() {
                let trimmed = line.trim_start();
                if !trimmed.starts_with("import") {
                    continue;
                }
                if !line.contains("from") {
                    continue;
                }
                if SHARED_PREFIXES.iter().any(|p| line.contains(p)) {
                    import_count += 1;
                }
            }
        }
    }

    let reuse_rate = if file_count == 0 {
        0.0
    } else {
        import_count as f64 / file_count as f64
    };

    ReuseMetric {
        import_count,
        file_count,
        reuse_rate,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn test_zero_when_no_imports() {
        let dir = tempdir().unwrap();
        let p = dir.path().join("src/pages/index.vue");
        fs::create_dir_all(p.parent().unwrap()).unwrap();
        fs::write(&p, "<template></template>").unwrap();
        let m = compute_reuse_rate(dir.path());
        assert_eq!(m.import_count, 0);
        assert_eq!(m.file_count, 1);
        assert_eq!(m.reuse_rate, 0.0);
    }

    #[test]
    fn test_counts_shared_imports() {
        let dir = tempdir().unwrap();
        let p = dir.path().join("src/pages/index.vue");
        fs::create_dir_all(p.parent().unwrap()).unwrap();
        fs::write(
            &p,
            r#"<script>
import { Btn } from '../components/Btn.vue';
import client from '../api/client';
</script>"#,
        )
        .unwrap();
        let m = compute_reuse_rate(dir.path());
        assert_eq!(m.import_count, 2);
        assert_eq!(m.file_count, 1);
        assert!((m.reuse_rate - 2.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_zero_when_pages_dir_missing() {
        let dir = tempdir().unwrap();
        let m = compute_reuse_rate(dir.path());
        assert_eq!(m.file_count, 0);
        assert_eq!(m.reuse_rate, 0.0);
    }

    #[test]
    fn test_two_layer_depth_imports() {
        // 子目录页面用 ../../ 也应该被识别
        let dir = tempdir().unwrap();
        let p = dir.path().join("src/pages/profile/index.vue");
        fs::create_dir_all(p.parent().unwrap()).unwrap();
        fs::write(
            &p,
            r#"<script>
import { Btn } from '../../components/Btn.vue';
import { theme } from '../../styles/theme';
import { route } from '../../utils/router';
</script>"#,
        )
        .unwrap();
        let m = compute_reuse_rate(dir.path());
        assert_eq!(m.import_count, 3);
        assert_eq!(m.file_count, 1);
    }
}
