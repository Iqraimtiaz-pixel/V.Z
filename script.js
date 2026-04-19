let user = "";
let msgCount = 0;

function login() {
  user = document.getElementById("username").value;

  if (user === "") return alert("Enter name");

  document.getElementById("loginPage").style.display = "none";
  document.getElementById("chatPage").style.display = "flex";
}

function sendMsg() {
  let msgInput = document.getElementById("msg");
  let msg = msgInput.value;

  if (msg === "") return;

  msgCount++;

  let chatBox = document.getElementById("chatBox");

  let message = document.createElement("div");

  let displayName = msgCount >= 5 ? user : "VibeUser";

  message.classList.add("message", "sent");
  message.innerHTML = `<b>${displayName}</b><br>${msg}`;

  chatBox.appendChild(message);

  msgInput.value = "";

  chatBox.scrollTop = chatBox.scrollHeight;

  // Fake reply (for demo feel)
  setTimeout(() => {
    let reply = document.createElement("div");
    reply.classList.add("message", "received");
    reply.innerHTML = `<b>Stranger</b><br>Nice vibe 😄`;

    chatBox.appendChild(reply);
    chatBox.scrollTop = chatBox.scrollHeight;

    setTimeout(() => {
      reply.remove();
    }, 5000);

  }, 1000);

  // vanish message
  setTimeout(() => {
    message.remove();
  }, 5000);

  // reveal status update
  if (msgCount >= 5) {
    document.getElementById("status").innerText = "Identity Revealed 🔓";
  }
}
