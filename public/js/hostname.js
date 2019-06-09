
const steamplay = "steam://rungame/730/76561202255233023/+playcast%20%22"

function RewriteIp(link,prefix){ // aタグのリンクを現在のホスト名に書き換える
    var href = prefix + link.html();
    console.log(href)
    link.attr("href", href)
}

var ip = location.href;
console.log(ip);
RewriteIp($('#a_match'),ip);