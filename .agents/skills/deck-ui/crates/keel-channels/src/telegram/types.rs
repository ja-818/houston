use serde::Deserialize;

/// Response from Telegram's `getMe` API.
#[derive(Debug, Deserialize)]
pub struct GetMeResponse {
    pub ok: bool,
    pub result: Option<TelegramUser>,
    pub description: Option<String>,
}

/// Response from Telegram's `getUpdates` API.
#[derive(Debug, Deserialize)]
pub struct GetUpdatesResponse {
    pub ok: bool,
    pub result: Option<Vec<Update>>,
    pub description: Option<String>,
}

/// Response from Telegram's `sendMessage` API.
#[derive(Debug, Deserialize)]
pub struct SendMessageResponse {
    pub ok: bool,
    pub description: Option<String>,
}

/// A Telegram update object.
#[derive(Debug, Deserialize)]
pub struct Update {
    pub update_id: i64,
    pub message: Option<TelegramMessage>,
}

/// A Telegram message.
#[derive(Debug, Deserialize)]
pub struct TelegramMessage {
    pub message_id: i64,
    pub from: Option<TelegramUser>,
    pub chat: Chat,
    pub date: i64,
    pub text: Option<String>,
    pub reply_to_message: Option<Box<TelegramMessage>>,
    pub document: Option<TelegramDocument>,
    pub photo: Option<Vec<PhotoSize>>,
}

/// A Telegram user.
#[derive(Debug, Deserialize)]
pub struct TelegramUser {
    pub id: i64,
    pub is_bot: Option<bool>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub username: Option<String>,
}

/// A Telegram chat.
#[derive(Debug, Deserialize)]
pub struct Chat {
    pub id: i64,
    #[serde(rename = "type")]
    pub chat_type: Option<String>,
    pub title: Option<String>,
    pub username: Option<String>,
}

/// A Telegram document attachment.
#[derive(Debug, Deserialize)]
pub struct TelegramDocument {
    pub file_id: String,
    pub file_name: Option<String>,
    pub mime_type: Option<String>,
    pub file_size: Option<u64>,
}

/// A Telegram photo size variant.
#[derive(Debug, Deserialize)]
pub struct PhotoSize {
    pub file_id: String,
    pub file_size: Option<u64>,
    pub width: i32,
    pub height: i32,
}
