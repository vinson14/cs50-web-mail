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
    document.querySelector("#email-view").style.display = "none";
    document.querySelector("#email-view").innerHTML = "";

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
    document.querySelector("#email-view").style.display = "none";
    document.querySelector("#email-view").innerHTML = "";

    // Show the mailbox name
    document.querySelector("#emails-view").innerHTML = `<h3>${
        mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
    }</h3>`;

    fetch(`/emails/${mailbox}`)
        .then((response) => response.json())
        .then((emails) => populate_emailList(emails, mailbox));
}

const populate_emailList = (list, mailbox) => {
    list.map((email) => {
        // Assign background color for read and unread emails
        bg = email.read ? "bg-light" : "bg-white";

        // Create container for each email
        var emailContainer = document.createElement("div");
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
        var emailSender = document.createElement("h5");
        emailSender.innerHTML = email.sender;
        var emailSubject = document.createElement("h5");
        emailSubject.innerHTML = email.subject;
        var emailTimestamp = document.createElement("h5");
        emailTimestamp.innerHTML = email.timestamp;

        // Append content to container
        emailContainer.append(emailSender, emailSubject, emailTimestamp);

        // Add event listener
        emailContainer.addEventListener("click", (e) => view_email(e, mailbox));

        // Add id
        emailContainer.id = `${email.id}`;

        document.querySelector("#emails-view").append(emailContainer);
    });
};

const view_email = (e, mailbox) => {
    document.querySelector("#email-view").style.display = "block";
    document.querySelector("#emails-view").style.display = "none";
    document.querySelector("#compose-view").style.display = "none";

    fetch(`/emails/${e.currentTarget.id}`)
        .then((response) => response.json())
        .then((email) => {
            // Sender
            var emailSender = document.createElement("h5");
            emailSender.innerHTML = `<b>From</b>: ${email.sender}`;

            // Recipients
            var emailRecipients = document.createElement("h5");
            emailRecipients.innerHTML = `<b>To</b>: ${email.recipients.join()}`;

            // Subject
            var emailSubject = document.createElement("h5");
            emailSubject.innerHTML = `<b>Subject</b>: ${email.subject}`;

            // Timestamp
            var emailTimestamp = document.createElement("h5");
            emailTimestamp.innerHTML = `<b>Timestamp</b>: ${email.timestamp}`;

            // Body
            var emailBody = document.createElement("p");
            emailBody.classList.add("border", "border-dark", "p-3", "my-3");
            emailBody.innerHTML = email.body;

            var replyButton = document.createElement("button");
            replyButton.innerHTML = "Reply";
            replyButton.classList.add("btn", "btn-sm", "btn-outline-primary");
            replyButton.addEventListener("click", (e) =>
                compose_email(
                    e,
                    email.sender,
                    `Re: ${email.subject}`,
                    `On ${email.timestamp} ${email.sender} wrote:\n${email.body}`,
                    ""
                )
            );

            document
                .querySelector("#email-view")
                .append(
                    emailSender,
                    emailRecipients,
                    emailSubject,
                    emailTimestamp,
                    emailBody,
                    replyButton
                );

            read_email(email.id);

            // Archive Button
            if (mailbox !== "sent") {
                var archiveButton = document.createElement("button");
                archiveButton.innerHTML = email.archived
                    ? "UnArchive"
                    : "Archive";
                archiveButton.classList.add(
                    "btn",
                    "btn-sm",
                    "btn-outline-primary",
                    "mx-3"
                );
                archiveButton.addEventListener("click", () =>
                    archive_email(email.id, email.archived)
                );
                document.querySelector("#email-view").append(archiveButton);
            }
        });
};

const read_email = (id) => {
    fetch(`/emails/${id}`, {
        method: "PUT",
        body: JSON.stringify({
            read: true,
        }),
    });
};

const archive_email = (id, archived) => {
    fetch(`/emails/${id}`, {
        method: "PUT",
        body: JSON.stringify({
            archived: !archived,
        }),
    }).then(load_mailbox("inbox"));
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
