use crate::sandbox_client::SandboxClient;
use anyhow::anyhow;
use runtime::{ToolError, ToolExecutor};
use serde_json::json;
use std::path::PathBuf;

pub struct SandboxToolExecutor {
    sandbox: SandboxClient,
    sandbox_id: String,
    workdir: PathBuf,
}

impl SandboxToolExecutor {
    pub fn new(sandbox: SandboxClient, sandbox_id: String, workdir: PathBuf) -> Self {
        Self {
            sandbox,
            sandbox_id,
            workdir,
        }
    }
}

impl ToolExecutor for SandboxToolExecutor {
    fn execute(&mut self, tool_name: &str, input: &str) -> Result<String, ToolError> {
        match tool_name {
            "bash" => execute_bash(&self.sandbox, &self.sandbox_id, input),
            "read_file" => execute_read_file(&self.workdir, input),
            "write_file" => execute_write_file(&self.workdir, input),
            "edit_file" => execute_edit_file(&self.workdir, input),
            "glob_search" => execute_glob_search(&self.workdir, input),
            "grep_search" => execute_grep_search(&self.workdir, input),
            other => Err(ToolError::new(format!("不支持的工具: {other}"))),
        }
    }
}

fn execute_bash(
    sandbox: &SandboxClient,
    sandbox_id: &str,
    input: &str,
) -> Result<String, ToolError> {
    let bash_input: serde_json::Value = serde_json::from_str(input)
        .map_err(|e| ToolError::new(format!("Invalid bash input JSON: {}", e)))?;

    let command = bash_input
        .get("command")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ToolError::new("Missing 'command' field in bash input"))?;

    let cmd = vec!["sh".to_string(), "-c".to_string(), command.to_string()];

    let exec_result = sandbox.exec(sandbox_id, cmd, None).map_err(|e| {
        ToolError::new(format!("Failed to execute bash in sandbox: {}", e))
    })?;

    let output = json!({
        "stdout": exec_result.stdout,
        "stderr": exec_result.stderr,
        "exit_code": exec_result.exit_code
    });

    Ok(output.to_string())
}

fn execute_read_file(workdir: &std::path::Path, input: &str) -> Result<String, ToolError> {
    let read_input: serde_json::Value = serde_json::from_str(input)
        .map_err(|e| ToolError::new(format!("Invalid read_file input JSON: {}", e)))?;

    let path = read_input
        .get("path")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ToolError::new("Missing 'path' field in read_file input"))?;

    let full_path = if std::path::Path::new(path).is_absolute() {
        std::path::PathBuf::from(path)
    } else {
        workdir.join(path)
    };

    let content = std::fs::read_to_string(&full_path)
        .map_err(|e| ToolError::new(format!("Failed to read file: {}", e)))?;

    Ok(content)
}

fn execute_write_file(workdir: &std::path::Path, input: &str) -> Result<String, ToolError> {
    let write_input: serde_json::Value = serde_json::from_str(input)
        .map_err(|e| ToolError::new(format!("Invalid write_file input JSON: {}", e)))?;

    let path = write_input
        .get("path")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ToolError::new("Missing 'path' field in write_file input"))?;

    let content = write_input
        .get("content")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ToolError::new("Missing 'content' field in write_file input"))?;

    let full_path = if std::path::Path::new(path).is_absolute() {
        std::path::PathBuf::from(path)
    } else {
        workdir.join(path)
    };

    if let Some(parent) = full_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| ToolError::new(format!("Failed to create directories: {}", e)))?;
    }

    std::fs::write(&full_path, content)
        .map_err(|e| ToolError::new(format!("Failed to write file: {}", e)))?;

    Ok(json!({"status": "ok"}).to_string())
}

fn execute_edit_file(workdir: &std::path::Path, input: &str) -> Result<String, ToolError> {
    let edit_input: serde_json::Value = serde_json::from_str(input)
        .map_err(|e| ToolError::new(format!("Invalid edit_file input JSON: {}", e)))?;

    let path = edit_input
        .get("path")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ToolError::new("Missing 'path' field in edit_file input"))?;

    let old_text = edit_input
        .get("old_text")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ToolError::new("Missing 'old_text' field in edit_file input"))?;

    let new_text = edit_input
        .get("new_text")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ToolError::new("Missing 'new_text' field in edit_file input"))?;

    let full_path = if std::path::Path::new(path).is_absolute() {
        std::path::PathBuf::from(path)
    } else {
        workdir.join(path)
    };

    let mut content = std::fs::read_to_string(&full_path)
        .map_err(|e| ToolError::new(format!("Failed to read file: {}", e)))?;

    if !content.contains(old_text) {
        return Err(ToolError::new(format!(
            "Pattern '{}' not found in file",
            old_text
        )));
    }

    content = content.replace(old_text, new_text);

    std::fs::write(&full_path, content)
        .map_err(|e| ToolError::new(format!("Failed to write file: {}", e)))?;

    Ok(json!({"status": "ok"}).to_string())
}

fn execute_glob_search(workdir: &std::path::Path, input: &str) -> Result<String, ToolError> {
    let glob_input: serde_json::Value = serde_json::from_str(input)
        .map_err(|e| ToolError::new(format!("Invalid glob_search input JSON: {}", e)))?;

    let pattern = glob_input
        .get("pattern")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ToolError::new("Missing 'pattern' field in glob_search input"))?;

    let search_path = glob_input
        .get("path")
        .and_then(|v| v.as_str())
        .unwrap_or(".");

    let full_pattern = workdir.join(search_path).join(pattern);
    let pattern_str = full_pattern
        .to_str()
        .ok_or_else(|| ToolError::new("Invalid pattern path"))?;

    let entries = glob::glob(pattern_str)
        .map_err(|e| ToolError::new(format!("Invalid glob pattern: {}", e)))?
        .filter_map(|entry| {
            entry
                .ok()
                .and_then(|path| path.to_str().map(|s| s.to_string()))
        })
        .collect::<Vec<_>>();

    Ok(json!(entries).to_string())
}

fn execute_grep_search(workdir: &std::path::Path, input: &str) -> Result<String, ToolError> {
    let grep_input: serde_json::Value = serde_json::from_str(input)
        .map_err(|e| ToolError::new(format!("Invalid grep_search input JSON: {}", e)))?;

    let pattern = grep_input
        .get("pattern")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ToolError::new("Missing 'pattern' field in grep_search input"))?;

    let search_path = grep_input
        .get("path")
        .and_then(|v| v.as_str())
        .unwrap_or(".");

    let full_path = if std::path::Path::new(search_path).is_absolute() {
        std::path::PathBuf::from(search_path)
    } else {
        workdir.join(search_path)
    };

    let mut results = Vec::new();

    if full_path.is_file() {
        let content = std::fs::read_to_string(&full_path)
            .map_err(|e| ToolError::new(format!("Failed to read file: {}", e)))?;

        for (line_no, line) in content.lines().enumerate() {
            if line.contains(pattern) {
                results.push(format!("{}:{}: {}", full_path.display(), line_no + 1, line));
            }
        }
    } else if full_path.is_dir() {
        for entry in walkdir::WalkDir::new(&full_path)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.path().is_file())
        {
            if let Ok(content) = std::fs::read_to_string(entry.path()) {
                for (line_no, line) in content.lines().enumerate() {
                    if line.contains(pattern) {
                        results.push(format!(
                            "{}:{}: {}",
                            entry.path().display(),
                            line_no + 1,
                            line
                        ));
                    }
                }
            }
        }
    }

    Ok(json!(results).to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tool_executor_creation() {
        let sandbox = SandboxClient::new("http://localhost:8091".to_string());
        let executor = SandboxToolExecutor::new(sandbox, "test-id".to_string(), PathBuf::from("/tmp"));
        assert_eq!(executor.sandbox_id, "test-id");
    }
}
