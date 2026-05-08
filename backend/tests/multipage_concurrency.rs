//! 验证 Semaphore 限流符合 multipage_scheduler 的预期行为。
//! 这是个纯并发原语行为测试，不依赖项目其他模块、不连 DB。

use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;

#[tokio::test]
async fn test_semaphore_limits_concurrency_to_max_value() {
    let max_concurrent = 2usize;
    let sem = Arc::new(tokio::sync::Semaphore::new(max_concurrent));
    let active = Arc::new(AtomicUsize::new(0));
    let max_seen = Arc::new(AtomicUsize::new(0));

    let mut joinset: tokio::task::JoinSet<()> = tokio::task::JoinSet::new();
    for _ in 0..5 {
        let sem = sem.clone();
        let active = active.clone();
        let max_seen = max_seen.clone();
        joinset.spawn(async move {
            let _permit = sem.acquire().await.unwrap();
            let cur = active.fetch_add(1, Ordering::SeqCst) + 1;
            // 跟踪同时活跃数的历史最大值
            let mut prev_max = max_seen.load(Ordering::SeqCst);
            while cur > prev_max {
                match max_seen.compare_exchange_weak(prev_max, cur, Ordering::SeqCst, Ordering::SeqCst) {
                    Ok(_) => break,
                    Err(actual) => prev_max = actual,
                }
            }
            tokio::time::sleep(std::time::Duration::from_millis(50)).await;
            active.fetch_sub(1, Ordering::SeqCst);
        });
    }
    while joinset.join_next().await.is_some() {}
    let observed_max = max_seen.load(Ordering::SeqCst);
    assert!(
        observed_max <= max_concurrent,
        "并发数 {observed_max} 超过限制 {max_concurrent}"
    );
    assert!(
        observed_max >= 1,
        "并发数应 ≥ 1，实际 {observed_max}（说明 spawn 一个都没跑）"
    );
}

#[tokio::test]
async fn test_semaphore_default_3_via_env() {
    // 模拟 multipage_scheduler 里读 MAX_CONCURRENT_SESSIONS 的逻辑
    let max_concurrent = std::env::var("MAX_CONCURRENT_SESSIONS")
        .ok()
        .and_then(|s| s.parse::<usize>().ok())
        .unwrap_or(3);
    // env 没设时默认 3
    if std::env::var("MAX_CONCURRENT_SESSIONS").is_err() {
        assert_eq!(max_concurrent, 3);
    }
    // env 即使被外部设了也至少 ≥ 1
    assert!(max_concurrent >= 1);
}
