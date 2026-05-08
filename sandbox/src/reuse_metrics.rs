//! 1.2.0：算多页项目里 shared/ 复用率
//!
//! 扫 src/pages 下所有 .vue 文件中 import shared/ 引用次数，除以 .vue 文件总数 = 复用率
//! 例如：3 个页面，每个 import 2 次 shared = 6 imports / 3 files = rate 2.0
//! 高于 1.0 表示平均每页有多次共享 import，复用很积极

use regex::Regex;
use serde::Serialize;
use std::path::Path;
use walkdir::WalkDir;

#[derive(Debug, Serialize)]
pub struct ReuseMetric {
    pub import_count: usize,
    pub file_count: usize,
    pub reuse_rate: f64,
}

pub fn compute_reuse_rate(workdir: &Path) -> ReuseMetric {
    let pages_dir = workdir.join("src/pages");
    let import_re = Regex::new(
        r#"import\s+.*?from\s+["'](\.\.?/)+(components|styles|api|store|utils)/"#,
    )
    .expect("regex 编译失败");

    let mut import_count = 0usize;
    let mut file_count = 0usize;

    if pages_dir.exists() {
        for entry in WalkDir::new(&pages_dir)
            .into_iter()
            .filter_map(Result::ok)
        {
            if !entry.file_type().is_file() {
                continue;
            }
            if entry.path().extension().and_then(|s| s.to_str()) != Some("vue") {
                continue;
            }
            file_count += 1;
            if let Ok(content) = std::fs::read_to_string(entry.path()) {
                import_count += import_re.find_iter(&content).count();
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
    fn test_reuse_rate_zero_when_no_imports() {
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
    fn test_reuse_rate_counts_shared_imports() {
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
        assert_eq!(m.reuse_rate, 2.0);
    }

    #[test]
    fn test_reuse_rate_zero_when_pages_dir_missing() {
        let dir = tempdir().unwrap();
        let m = compute_reuse_rate(dir.path());
        assert_eq!(m.file_count, 0);
        assert_eq!(m.reuse_rate, 0.0);
    }
}
