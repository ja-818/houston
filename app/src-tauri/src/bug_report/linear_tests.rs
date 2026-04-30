use super::linear::send_bug_report_to;
use super::linear_graphql::{
    linear_graphql_error_message, linear_http_error_message, LinearGraphqlError,
};
use super::sample_payload;
use reqwest::StatusCode;
use std::io::{Read, Write};
use std::net::TcpListener;

#[test]
fn linear_http_error_message_keeps_status_and_body() {
    let message = linear_http_error_message(StatusCode::BAD_REQUEST, "bad input");
    assert_eq!(message, "Linear API failed: 400 Bad Request bad input");
}

#[test]
fn linear_graphql_error_message_summarizes_errors() {
    let errors = vec![
        LinearGraphqlError {
            message: "teamId is invalid".to_string(),
        },
        LinearGraphqlError {
            message: "permission denied".to_string(),
        },
    ];
    assert_eq!(
        linear_graphql_error_message(&errors),
        "Linear API returned GraphQL errors: teamId is invalid; permission denied"
    );
}

#[tokio::test]
async fn send_bug_report_posts_linear_issue_create_mutation() {
    let (url, server) = serve_sequence(vec![
        (
            "200 OK",
            "{\"data\":{\"team\":{\"labels\":{\"nodes\":[{\"id\":\"label-id\",\"name\":\"User Bug\"}]}}}}",
        ),
        (
            "200 OK",
            "{\"data\":{\"issueCreate\":{\"success\":true,\"issue\":{\"id\":\"issue-id\",\"identifier\":\"BUG-1\",\"url\":\"https://linear.app/issue/BUG-1\"}}}}",
        ),
    ]);

    send_bug_report_to(
        &url,
        "test-api-key",
        "team-id",
        "User Bug",
        &sample_payload(),
    )
    .await
    .expect("send bug report");

    let requests = server.join().expect("join test server");
    let joined = requests.join("\n---REQUEST---\n");
    let lower = joined.to_ascii_lowercase();
    assert!(requests
        .iter()
        .all(|request| request.starts_with("POST /graphql HTTP/1.1")));
    assert!(lower.contains("authorization: test-api-key"));
    assert!(joined.contains("HoustonBugReportLabel"));
    assert!(joined.contains("\"labelName\":\"User Bug\""));
    assert!(joined.contains("HoustonBugReportCreate"));
    assert!(joined.contains("\"teamId\":\"team-id\""));
    assert!(joined.contains("\"labelIds\":[\"label-id\"]"));
    assert!(
        joined.contains("\"title\":\"Houston bug: list_workspaces - Error: no workspace found\"")
    );
}

#[tokio::test]
async fn send_bug_report_surfaces_graphql_errors() {
    let (url, server) = serve_sequence(vec![(
        "200 OK",
        "{\"errors\":[{\"message\":\"teamId is invalid\"}]}",
    )]);

    let error = send_bug_report_to(
        &url,
        "test-api-key",
        "team-id",
        "User Bug",
        &sample_payload(),
    )
    .await
    .expect_err("GraphQL error should fail");

    server.join().expect("join test server");
    assert_eq!(
        error,
        "Linear API returned GraphQL errors: teamId is invalid"
    );
}

#[tokio::test]
async fn send_bug_report_fails_when_label_is_missing() {
    let (url, server) = serve_sequence(vec![(
        "200 OK",
        "{\"data\":{\"team\":{\"labels\":{\"nodes\":[]}}}}",
    )]);

    let error = send_bug_report_to(
        &url,
        "test-api-key",
        "team-id",
        "User Bug",
        &sample_payload(),
    )
    .await
    .expect_err("missing label should fail");

    server.join().expect("join test server");
    assert_eq!(error, "Linear bug label not found: User Bug");
}

#[tokio::test]
#[ignore = "requires Linear config via env or local .env; creates a real Linear issue"]
async fn creates_real_linear_issue_when_env_is_set() {
    let mut payload = sample_payload();
    payload.command = "local_linear_bug_report_smoke_test".to_string();
    payload.error = format!(
        "Local Linear bug-report smoke test from cargo test at {:?}",
        std::time::SystemTime::now()
    );

    super::report_bug(payload)
        .await
        .expect("create real Linear issue");
}

fn serve_sequence(
    responses: Vec<(&'static str, &'static str)>,
) -> (String, std::thread::JoinHandle<Vec<String>>) {
    let listener = TcpListener::bind("127.0.0.1:0").expect("bind test server");
    let addr = listener.local_addr().expect("read listener address");
    let server = std::thread::spawn(move || {
        let mut requests = Vec::new();
        for (status, body) in responses {
            let (mut stream, _) = listener.accept().expect("accept request");
            let request = read_request(&mut stream);
            let response = format!(
                "HTTP/1.1 {status}\r\nContent-Type: application/json\r\nContent-Length: {}\r\n\r\n{body}",
                body.len()
            );
            stream
                .write_all(response.as_bytes())
                .expect("write response");
            requests.push(String::from_utf8(request).expect("request is utf8"));
        }
        requests
    });
    (format!("http://{addr}/graphql"), server)
}

fn read_request(stream: &mut std::net::TcpStream) -> Vec<u8> {
    let mut request = Vec::new();
    let mut buffer = [0; 1024];
    loop {
        let read = stream.read(&mut buffer).expect("read request");
        if read == 0 {
            break;
        }
        request.extend_from_slice(&buffer[..read]);
        if let Some(header_end) = find_header_end(&request) {
            let headers = String::from_utf8_lossy(&request[..header_end]);
            let content_length = headers
                .lines()
                .find_map(|line| {
                    let (name, value) = line.split_once(':')?;
                    name.eq_ignore_ascii_case("content-length")
                        .then(|| value.trim())
                })
                .and_then(|value| value.parse::<usize>().ok())
                .unwrap_or(0);
            if request.len() >= header_end + 4 + content_length {
                break;
            }
        }
    }
    request
}

fn find_header_end(request: &[u8]) -> Option<usize> {
    request.windows(4).position(|window| window == b"\r\n\r\n")
}
