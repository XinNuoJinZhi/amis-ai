use std::collections::HashSet;
use std::sync::Mutex;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum PortPoolError {
    #[error("端口池已耗尽")]
    Exhausted,
    #[error("端口 {0} 不属于本池或未被分配")]
    NotAllocated(u16),
}

pub struct PortPool {
    range: std::ops::Range<u16>,
    allocated: Mutex<HashSet<u16>>,
}

impl PortPool {
    pub fn new(start: u16, end: u16) -> Self {
        assert!(start < end, "start 必须小于 end");
        Self {
            range: start..end,
            allocated: Mutex::new(HashSet::new()),
        }
    }

    pub fn allocate(&self) -> Result<u16, PortPoolError> {
        let mut set = self.allocated.lock().unwrap();
        for port in self.range.clone() {
            if set.contains(&port) {
                continue;
            }
            // 2026-05-13：sandbox-service restart 后 HashSet 清空但宿主机上历史
            // amis-ai-sandbox-* 容器仍占着原端口（amis-ai 1.6 W3 加了「保护 active
            // sandbox」之后更常见）→ try-bind 验证端口实际可用，避免 docker run
            // 时撞 "port is already allocated"
            match std::net::TcpListener::bind(("127.0.0.1", port)) {
                Ok(listener) => {
                    drop(listener); // 立刻释放，让 docker 再 bind
                    set.insert(port);
                    return Ok(port);
                }
                Err(_) => {
                    // 端口被外部进程/容器占着，先标 allocated 让本进程不再尝试
                    // （兜底防御：不依赖外部释放才能恢复分配能力）
                    set.insert(port);
                    continue;
                }
            }
        }
        Err(PortPoolError::Exhausted)
    }

    pub fn release(&self, port: u16) -> Result<(), PortPoolError> {
        let mut set = self.allocated.lock().unwrap();
        if !self.range.contains(&port) || !set.remove(&port) {
            return Err(PortPoolError::NotAllocated(port));
        }
        Ok(())
    }

    pub fn in_use(&self) -> usize {
        self.allocated.lock().unwrap().len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn allocate_and_release_roundtrip() {
        let pool = PortPool::new(20000, 20003);
        let a = pool.allocate().unwrap();
        let b = pool.allocate().unwrap();
        assert_ne!(a, b);
        assert_eq!(pool.in_use(), 2);
        pool.release(a).unwrap();
        assert_eq!(pool.in_use(), 1);
    }

    #[test]
    fn allocate_exhaustion_returns_error() {
        let pool = PortPool::new(20000, 20002);
        assert_eq!(pool.allocate().unwrap(), 20000);
        assert_eq!(pool.allocate().unwrap(), 20001);
        assert!(matches!(pool.allocate(), Err(PortPoolError::Exhausted)));
    }

    #[test]
    fn release_out_of_range_returns_error() {
        let pool = PortPool::new(20000, 20010);
        assert!(matches!(pool.release(12345), Err(PortPoolError::NotAllocated(12345))));
    }

    #[test]
    fn release_not_allocated_returns_error() {
        let pool = PortPool::new(20000, 20010);
        assert!(matches!(pool.release(20005), Err(PortPoolError::NotAllocated(20005))));
    }
}
