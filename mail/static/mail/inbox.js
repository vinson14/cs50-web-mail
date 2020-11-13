document.addEventListener("DOMContentLoaded", function () {
    // Use buttons to toggle between views
    document
        .querySelector("#inbox")
        .addEventListener("click", () => load_mailbox("inbox"));
    document
        .querySelector("#sent")
        .addEventListener("click", () => load_mailbox("sent"));
    document
        .querySelector("#archived")
        .addEventListener("click", () => load_mailbox("archive"));
    document.querySelector("#compose").addEventListener("click", compose_email);
    document
        .querySelector("#compose-form")
        .addEventListener("submit", (e) => send_email(e));

    // By default, load the inbox
    load_mailbox("inbox");
});

function compose_email(
    e,
    recipients = "",
    subject = "",
    body = "",
    error = ""
) {
    // Show compose view and hide other views
    document.querySelector("#emails-view").style.display = "none";
    document.querySelector("#compose-view").style.display = "block";

    if (error) {
        document.querySelector("#compose-error").style.display = "block";
    } else {
        document.querySelector("#compose-error").style.display = "none";
    }

    // Clear out composition fields
    document.querySelector("#compose-error").innerHTML = error;
    document.querySelector("#compose-recipients").value = recipients;
    document.querySelector("#compose-subject").value = subject;
    document.querySelector("#compose-body").value = body;
}

function load_mailbox(mailbox) {
    // Show the mailbox and hide other views
    document.querySelector("#emails-view").style.display = "block";
    document.querySelector("#compose-view").style.display = "none";

    // Show the mailbox name
    document.querySelector("#emails-view").innerHTML = `<h3>${
        mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
    }</h3>`;

    fetch(`/emails/${mailbox}`)
        .then((response) => response.json())
        .then((emails) =>
            emails.map((email) => {
                bg = email.read ? "bg-light" : "bg-white";

                // Create container for each email
                emailContainer = document.createElement("div");
                emailContainer.classList.add(
                    bg,
                    "d-flex",
                    "justify-content-between",
                    "p-1",
                    "m-2",
                    "border",
                    "border-dark"
                );

                // Email sender, subject and timestamp
                emailSender = document.createElement("h5");
                emailSender.innerHTML = email.sender;
                emailSubject = document.createElement("h5");
                emailSubject.innerHTML = email.subject;
                emailTimestamp = document.createElement("h5");
                emailTimestamp.innerHTML = email.timestamp;
                
                // Append content to container
                emailContainer.append(emailSender, emailSubject, emailTimestamp);

                // Add event listener
                emailContainer.addEventListener('click', view_email)

                // Add id
                emailContainer.id = `${email.id}`

                document.querySelector("#emails-view").append(emailContainer);
            })
        );
}

const view_email = (e) => {
    console.log(e.target.id)
    fetch(`/emails/${e.target.id}`)
    .then(response => response.json())
    .then(email => {
        console.log(email)
    })
};

const send_email = (e) => {
    // Prevent the page from refreshing
    e.preventDefault();

    // Store the values of the form
    let recipients = document.querySelector("#compose-recipients").value;
    let subject = document.querySelector("#compose-subject").value;
    let body = document.querySelector("#compose-body").value;

    // Send an API POST request
    fetch("/emails", {
        method: "POST",
        body: JSON.stringify({
            recipients: recipients,
            subject: subject,
            body: body,
        }),
    }).then((response) => {
        if (response.status == 201) {
            load_mailbox("sent");
        } else {
            response.json().then((result) => {
                compose_email(e, recipients, subject, body, result.error);
            });
        }
    });
};
