use once_cell::sync::Lazy;
use regex::Regex;

static RE_READY: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"Local:\s+(https?://[^\s]+)").unwrap()
});
static RE_ERROR: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)\[vite\].*?(error|ENOENT|failed)|ERR!|ELIFECYCLE").unwrap()
});

#[derive(Debug, Clone, PartialEq)]
pub enum LogSignal {
    Ready(String),
    Failed(String),
    Neutral,
}

pub fn classify(line: &str) -> LogSignal {
    if let Some(cap) = RE_READY.captures(line) {
        return LogSignal::Ready(cap.get(1).unwrap().as_str().to_string());
    }
    if RE_ERROR.is_match(line) {
        return LogSignal::Failed(line.trim().to_string());
    }
    LogSignal::Neutral
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
}
