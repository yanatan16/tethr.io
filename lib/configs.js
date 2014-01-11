// configs.js
// configs for WebRTC for tethr.js

exports.peer_connection_config = {
  optional: [
    { RtpDataChannels: true },
    { DtlsSrtpKeyAgreement: true }
  ]
}

exports.data_channel_options = {
  reliable: false
}