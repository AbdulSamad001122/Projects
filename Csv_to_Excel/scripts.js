document.addEventListener("DOMContentLoaded", function () {
    let dropArea = document.getElementById("drop-area");

    dropArea.addEventListener("dragover", function (e) {
        e.preventDefault();
        dropArea.classList.add("highlight");
    });

    dropArea.addEventListener("dragleave", function () {
        dropArea.classList.remove("highlight");
    });

    dropArea.addEventListener("drop", function (e) {
        e.preventDefault();
        dropArea.classList.remove("highlight");

        let file = e.dataTransfer.files[0];
        if (file) {
            uploadFile(file);
        }
    });

    document.getElementById("fileInput").addEventListener("change", function (event) {
        let file = event.target.files[0];
        if (file) {
            uploadFile(file);
        }
    });
});

function uploadFile(file) {
    let formData = new FormData();
    formData.append("file", file);

    fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            console.log("Success:", data);
            document.getElementById("options").style.display = "block";
            displayPreview(data.preview);
        })
        .catch(error => console.error("Error:", error));
}

function processFile() {
    let removeDuplicates = document.getElementById("removeDuplicates").checked;
    let fillMissing = document.getElementById("fillMissing").checked;
    let format = document.getElementById("format").value;

    fetch("http://127.0.0.1:5000/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removeDuplicates, fillMissing, format })
    })
        .then(response => response.blob())
        .then(blob => {
            let url = window.URL.createObjectURL(blob);
            let a = document.createElement("a");
            a.href = url;
            a.download = "processed_file." + format;
            document.body.appendChild(a);
            a.click();
            a.remove();
        })
        .catch(error => console.error("Error:", error));
}

function displayPreview(data) {
    let table = document.getElementById("previewTable");
    table.innerHTML = "";
    let headerRow = document.createElement("tr");

    data.headers.forEach(header => {
        let th = document.createElement("th");
        th.innerText = header;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    data.rows.forEach(row => {
        let tr = document.createElement("tr");
        row.forEach(cell => {
            let td = document.createElement("td");
            td.innerText = cell;
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });
}
