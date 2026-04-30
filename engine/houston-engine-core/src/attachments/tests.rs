use super::*;
use crate::CoreError;

fn input(name: &str, size: u64) -> AttachmentUploadInput {
    AttachmentUploadInput {
        name: name.into(),
        size,
        mime: Some("application/octet-stream".into()),
    }
}

#[test]
fn create_upload_sessions_validates_scope() {
    let home = tempfile::TempDir::new().unwrap();
    let err = create_upload_sessions(
        home.path(),
        CreateAttachmentUploadsRequest {
            scope_id: "../evil".into(),
            files: vec![input("note.txt", 5)],
        },
    )
    .unwrap_err();
    assert!(matches!(err, CoreError::BadRequest(_)));
}

#[test]
fn create_upload_sessions_limits_one_create_request_not_scope() {
    let home = tempfile::TempDir::new().unwrap();
    let files = (0..=MAX_UPLOAD_SESSIONS_PER_CREATE_REQUEST)
        .map(|i| input(&format!("statement-{i}.pdf"), 1))
        .collect();
    let err = create_upload_sessions(
        home.path(),
        CreateAttachmentUploadsRequest {
            scope_id: "activity-1".into(),
            files,
        },
    )
    .unwrap_err();
    assert!(matches!(err, CoreError::BadRequest(_)));

    for chunk in (0..72)
        .collect::<Vec<_>>()
        .chunks(MAX_UPLOAD_SESSIONS_PER_CREATE_REQUEST)
    {
        let sessions = create_upload_sessions(
            home.path(),
            CreateAttachmentUploadsRequest {
                scope_id: "activity-1".into(),
                files: chunk
                    .iter()
                    .map(|i| input(&format!("statement-{i}.pdf"), 1))
                    .collect(),
            },
        )
        .unwrap();
        assert_eq!(sessions.len(), chunk.len());
    }
}

#[test]
fn commit_upload_writes_manifest_and_prompt_path() {
    let home = tempfile::TempDir::new().unwrap();
    let sessions = create_upload_sessions(
        home.path(),
        CreateAttachmentUploadsRequest {
            scope_id: "activity-1".into(),
            files: vec![input("../../note.txt", 5)],
        },
    )
    .unwrap();
    let session = sessions[0].clone();
    let temp = upload_temp_path(home.path(), &session.id).unwrap();
    std::fs::write(&temp, b"hello").unwrap();
    let out = commit_upload(
        home.path(),
        &session,
        &temp,
        5,
        "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824".into(),
    )
    .unwrap();
    assert!(out.path.contains("activity-1/files/"));
    assert!(!out.path.contains("/../"));
    assert_eq!(std::fs::read(&out.path).unwrap(), b"hello");
    let manifests = list(home.path(), "activity-1").unwrap();
    assert_eq!(manifests.len(), 1);
    assert_eq!(manifests[0].original_name, "../../note.txt");
}

#[test]
fn commit_upload_rejects_size_mismatch() {
    let home = tempfile::TempDir::new().unwrap();
    let session = create_upload_sessions(
        home.path(),
        CreateAttachmentUploadsRequest {
            scope_id: "s".into(),
            files: vec![input("a.txt", 1)],
        },
    )
    .unwrap()
    .remove(0);
    let temp = upload_temp_path(home.path(), &session.id).unwrap();
    std::fs::write(&temp, b"ab").unwrap();
    let err = commit_upload(home.path(), &session, &temp, 2, "hash".into()).unwrap_err();
    assert!(matches!(err, CoreError::BadRequest(_)));
    assert!(!temp.exists());
}

#[test]
fn delete_removes_new_and_legacy_scope_dirs() {
    let home = tempfile::TempDir::new().unwrap();
    let root = storage::attachments_root(home.path());
    std::fs::create_dir_all(root.join("scopes/s/files")).unwrap();
    std::fs::create_dir_all(root.join("s")).unwrap();
    delete(home.path(), "s").unwrap();
    assert!(!root.join("scopes/s").exists());
    assert!(!root.join("s").exists());
}

#[test]
fn delete_removes_unreferenced_objects_only() {
    let home = tempfile::TempDir::new().unwrap();
    let hash = "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824";
    let first = committed_fixture(home.path(), "s1", hash);
    let second = committed_fixture(home.path(), "s2", hash);
    let object = storage::object_path(home.path(), hash).unwrap();
    assert!(object.exists());

    delete(home.path(), "s1").unwrap();
    assert!(object.exists());
    assert!(std::path::Path::new(&second.path).exists());
    assert!(!std::path::Path::new(&first.path).exists());

    delete(home.path(), "s2").unwrap();
    assert!(!object.exists());
}

fn committed_fixture(home: &std::path::Path, scope: &str, hash: &str) -> AttachmentCommit {
    let session = create_upload_sessions(
        home,
        CreateAttachmentUploadsRequest {
            scope_id: scope.into(),
            files: vec![input("note.txt", 5)],
        },
    )
    .unwrap()
    .remove(0);
    let temp = upload_temp_path(home, &session.id).unwrap();
    std::fs::write(&temp, b"hello").unwrap();
    commit_upload(home, &session, &temp, 5, hash.into()).unwrap()
}
