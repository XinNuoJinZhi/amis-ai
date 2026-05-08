//! 调 agent /route-infer 推断 UniApp 路由路径

use serde::{Deserialize, Serialize};

const AGENT_ROUTE_INFER_URL: &str = "http://localhost:8000/route-infer";

#[derive(Serialize)]
struct InferRouteRequest<'a> {
    amis_json: &'a str,
    fallback_idx: i32,
}

#[derive(Deserialize)]
struct InferRouteResponse {
    route_path: String,
}

/// 调 agent 推断路由路径；失败回退 /pageN
pub async fn infer_route_path(amis_json: &str, fallback_idx: i32) -> String {
    let client = match reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
    {
        Ok(c) => c,
        Err(_) => return format!("/page{}", fallback_idx),
    };
    let req = InferRouteRequest { amis_json, fallback_idx };
    match client.post(AGENT_ROUTE_INFER_URL).json(&req).send().await {
        Ok(resp) if resp.status().is_success() => match resp.json::<InferRouteResponse>().await {
            Ok(body) => body.route_path,
            Err(_) => format!("/page{}", fallback_idx),
        },
        _ => format!("/page{}", fallback_idx),
    }
}
