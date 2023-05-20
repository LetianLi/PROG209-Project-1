const Table = {
    generateHeaderRow: function(headers) {
        let headerRow = document.createElement("tr"); // tr = table row

        headers.forEach(data => {
            let tableHeader = document.createElement("th");
            tableHeader.innerHTML = data;
            headerRow.appendChild(tableHeader);
        });

        return headerRow;
    },

    generateSimpleTextRow: function(text) {
        let row = document.createElement("tr");

        text.forEach(data => {
            let cell = document.createElement("td");
            cell.innerHTML = data;
            row.appendChild(cell);
        });

        return row;
    }
};