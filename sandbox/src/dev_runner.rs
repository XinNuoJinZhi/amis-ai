use once_cell::sync::Lazy;
use regex::Regex;

// 优先匹配：带 URL 的 "Local: http://localhost:5173/"，这样能拿到精确地址
static RE_READY_URL: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"Local:\s+(https?://[^\s]+)").unwrap());

// 兜底匹配：没有完整 URL 时，识别其他表示"启动完成"的信号
// - UniApp CLI: "ready in 1234ms"
// - Vite 5+: "VITE v5.x.x  ready in Nms"
// - 通用: "listening on" / "dev server running at"
static RE_READY_FALLBACK: Lazy<Regex> = Lazy::new(|| {
    Regex::new(
        r"(?i)(ready\s+in\s+\d+\s*ms|listening\s+on\s+port|dev server running at|vite\s+v[\d.]+\s+ready)"
    )
    .unwrap()
});

static RE_ERROR: Lazy<Regex> = Lazy::new(|| {
    Regex::new(
        r"(?i)\[vite\].*?(error|ENOENT|failed)|ERR!|ELIFECYCLE|Cannot find module|Module parse failed"
    )
    .unwrap()
});

/// Ready 之后的运行时错误（浏览器请求触发的按需编译、HMR 报错等）。
/// 关键特征：通常带 Vite 插件前缀 `[plugin:vite:xxx]`、`Failed to resolve import`、
/// `Pre-transform error`、`[vite] page reload ... error` 等。
static RE_RUNTIME_ERROR: Lazy<Regex> = Lazy::new(|| {
    Regex::new(
        r"(?i)(\[plugin:vite:[^\]]+\]|Failed to resolve import|Pre-transform error|Internal server error|SyntaxError:|TypeError:|ReferenceError:|\[vite\]\s+page reload.*error|\[vite\]\s+hmr.*error|Cannot find module|Module parse failed)"
    )
    .unwrap()
});

#[derive(Debug, Clone, PartialEq)]
pub enum LogSignal {
    Ready(String),
    Failed(String),
    Neutral,
}

pub fn classify(line: &str) -> LogSignal {
    // 优先尝试匹配精确 URL
    if let Some(cap) = RE_READY_URL.captures(line) {
        return LogSignal::Ready(cap.get(1).unwrap().as_str().to_string());
    }
    // 兜底：识别"启动完成"信号但无 URL，占位一个默认 URL（实际 preview_port 由调用方已知）
    if RE_READY_FALLBACK.is_match(line) {
        return LogSignal::Ready("http://localhost:5173/".to_string());
    }
    if RE_ERROR.is_match(line) {
        return LogSignal::Failed(line.trim().to_string());
    }
    LogSignal::Neutral
}

/// 只在 Vite 已经 Ready 之后使用：检测浏览器按需编译触发的运行时错误。
/// 命中时返回 Some(简短 reason)，调用方需要把 DevStatus 从 Ready 切到 RuntimeError 并喂给 Agent。
pub fn classify_runtime_error(line: &str) -> Option<String> {
    if RE_RUNTIME_ERROR.is_match(line) {
        Some(line.trim().to_string())
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn vite_ready_line_is_detected() {
        let l = "  ➜  Local:   http://localhost:5173/";
        assert_eq!(classify(l), LogSignal::Ready("http://localhost:5173/".to_string()));
    }

    #[test]
    fn vite_error_line_is_detected() {
        let l = "[vite] Internal server error: ENOENT: no such file";
        assert!(matches!(classify(l), LogSignal::Failed(_)));
    }

    #[test]
    fn neutral_line_is_neutral() {
        assert_eq!(classify("something normal"), LogSignal::Neutral);
    }

    #[test]
    fn npm_err_is_detected_as_failed() {
        assert!(matches!(classify("npm ERR! code ELIFECYCLE"), LogSignal::Failed(_)));
    }

    #[test]
    fn vite5_ready_without_url() {
        assert!(matches!(
            classify("  VITE v5.4.21  ready in 381 ms"),
            LogSignal::Ready(_)
        ));
    }

    #[test]
    fn uni_ready_line() {
        assert!(matches!(classify("  ready in 1823ms."), LogSignal::Ready(_)));
    }

    #[test]
    fn runtime_error_import_analysis() {
        let l = "[plugin:vite:import-analysis] Failed to resolve import \"wot-design-uni/index.css\" from \"src/main.ts\"";
        assert!(classify_runtime_error(l).is_some());
    }

    #[test]
    fn runtime_error_failed_to_resolve() {
        let l = "10:58:40 [vite] Failed to resolve import \"./foo\" from \"src/pages/x.vue\"";
        assert!(classify_runtime_error(l).is_some());
    }

    #[test]
    fn runtime_error_plain_neutral() {
        assert!(classify_runtime_error("  page reload /index.html").is_none());
    }
}
