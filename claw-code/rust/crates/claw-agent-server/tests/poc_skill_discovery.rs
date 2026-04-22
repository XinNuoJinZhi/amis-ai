//! A.0 PoC：验证 `CLAW_CONFIG_HOME` 能让 `amis-ai/skills/` 被 claw-code 的
//! `discover_skill_roots`/`load_skills_from_roots` 发现。
//!
//! 验证通过后，A.5 会在 claw-agent-server 启动时设置
//! `CLAW_CONFIG_HOME=/home/karl/Working/TianXing/amis-ai`，
//! 从而让 `amis-ai/skills/<bucket>/SKILL.md` 全部被 Agent 通过 `Skill` 工具按需读到。

use std::path::PathBuf;

#[test]
fn claw_config_home_skills_are_discovered() {
    // 用一个干净的临时目录当 cwd，**避免**项目祖先的 .claude/skills 等"假阳性"干扰。
    let cwd = tempfile::tempdir().expect("create temp cwd");

    // 准备 PoC skills：/tmp/poc-claw-skills/skills/hello/SKILL.md（已由测试外部 mkdir + Write 完成）
    // 这里做存在性断言，避免 PoC 物料未就位时给出误导性"找不到"结果。
    let poc_root = PathBuf::from("/tmp/poc-claw-skills");
    let skill_md = poc_root.join("skills").join("hello").join("SKILL.md");
    assert!(
        skill_md.exists(),
        "PoC fixture missing: {} （请先创建测试用 SKILL.md）",
        skill_md.display()
    );

    // 关键：设置 CLAW_CONFIG_HOME 指向 PoC 根。
    // claw-code 会自动扫 `$CLAW_CONFIG_HOME/skills` 下的桶。
    // SAFETY：单测进程内串行设置 env，不与其他测试共享。
    std::env::set_var("CLAW_CONFIG_HOME", &poc_root);

    // 调用 claw-code commands crate 的 list 入口。
    // 内部依次执行 discover_skill_roots(cwd) → load_skills_from_roots(&roots) → render。
    let output = commands::handle_skills_slash_command(Some("list"), cwd.path())
        .expect("handle_skills_slash_command should succeed");

    eprintln!("---- /skills list output ----\n{output}\n----------------------------");

    // 验收：输出里能看到 "hello" 这个 skill 的痕迹。
    assert!(
        output.contains("hello"),
        "expected discovered skill 'hello' in output, got:\n{output}"
    );
}

/// A.1+A.2 验证：把 CLAW_CONFIG_HOME 指向真实的 amis-ai 项目根，
/// 确认 _common 和 uniapp-wot-h5 两个桶都能被发现，
/// 且它们的 description 是从 SKILL.md frontmatter 正确解析出来的。
#[test]
fn amis_ai_skills_buckets_are_discovered() {
    let cwd = tempfile::tempdir().expect("create temp cwd");

    let amis_ai_root = std::path::PathBuf::from("/home/karl/Working/TianXing/amis-ai");
    assert!(
        amis_ai_root.join("skills/_common/SKILL.md").exists(),
        "_common/SKILL.md missing"
    );
    assert!(
        amis_ai_root.join("skills/uniapp-wot-h5/SKILL.md").exists(),
        "uniapp-wot-h5/SKILL.md missing"
    );

    // SAFETY：单进程串行 env，且这是测试代码。
    std::env::set_var("CLAW_CONFIG_HOME", &amis_ai_root);

    let output = commands::handle_skills_slash_command(Some("list"), cwd.path())
        .expect("handle_skills_slash_command should succeed");

    eprintln!("---- amis-ai /skills list ----\n{output}\n----------------------------");

    // 验收 1：两个桶都能被列出。
    assert!(
        output.contains("_common"),
        "expected _common bucket in output, got:\n{output}"
    );
    assert!(
        output.contains("uniapp-wot-h5"),
        "expected uniapp-wot-h5 bucket in output, got:\n{output}"
    );

    // 验收 2：描述（frontmatter description）能被解析出来。
    assert!(
        output.contains("\"产品哲学\"") || output.contains("amis-ai 反向飞轮"),
        "expected _common description fragment in output, got:\n{output}"
    );
    assert!(
        output.contains("UniApp + Wot UI"),
        "expected uniapp-wot-h5 description fragment in output, got:\n{output}"
    );
}
