// client.js
// client disambiguation for tethr.js

exports.PeerConnection = window.PeerConnection ||
  window.webkitPeerConnection00 ||
  window.webkitRTCPeerConnection ||
  window.mozRTCPeerConnection

exports.RTCIceCandidate = window.mozRTCIceCandidate ||
  window.RTCIceCandidate

exports.RTCSessionDescription = window.mozRTCSessionDescription ||
  window.RTCSessionDescription // Order is important here