const {spawn} = require("child_process");
const escape = require("escape-path-with-spaces");


//console.log(escape("D:/a  bc /d e da /a.txt"))
var minecraft = spawn("powershell.exe", [`-Command`, `& "D:/lê mao/tét.txt" -Xmx2000`]);

minecraft.stdout.on("data", function (data) {
    console.log(data.toString());
});

minecraft.stderr.on("data", function (data) {
    console.log(data.toString());
});

minecraft.on("exit", function (code) {
    console.log("Minecraft process exited with code: " + code.toString());
});