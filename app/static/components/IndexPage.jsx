import ReactDOM from "react-dom";
import React from "react";
import { ContentsWrapper, Wrapper, Titlebar, Sidebar } from "./SubComponents";
import { Redirect } from "react-router";
import $ from "jquery";
const os = window.require("os");
const { ipcRenderer } = window.require("electron");
const remote = window.require("electron").remote;
const { channels } = window;

export default class Index extends React.Component {
	constructor(props) {
		super(props);
		this.downloadInit = "<h2>VÀO GAME</h2><h3>Phiên bản 1.12.2</h3>";
		this.prog = "Đang tải thông tin phiên bản...";
		this.updateAvailable = null;
		this.isNoticing = false;
        this.downloading = false;
		this.minRam = 128;
		this.maxRam = os.totalmem() / 1024 / 1024;
        var upAvail =  JSON.parse(window.sessionStorage.getItem("updateAvailable"));
        console.log(upAvail);
		this.state = { memory: window.localStorage.getItem("memory") || this.minRam, updateAvailable: upAvail == null ? null : upAvail };
		var color = "#35c467";
		var color2 = "#c92430";
		var color3 = "#2877ed";

		ipcRenderer.on(channels.update.available, (e, d) => {
			this.setState({ ...this.state, updateAvailable: true });
		});

		ipcRenderer.on(channels.update.unavailable, (e, d) => {
			this.setState({ ...this.state, updateAvailable: false });
		});

		ipcRenderer.on(channels.download.response, (e, d) => {
			var btn = $("#play-button");
			if (d) {
                this.downloading = true;
				btn.css("background-color", color);
				btn.css("box-shadow", `-1px 2px 33px 1px ${color}`);
			} else {
				if (this.isNoticing) return;
				this.isNoticing = true;
				btn.css("background-color", color2);
				btn.css("box-shadow", `-1px 2px 33px 1px ${color2}`);
				btn.html("<h2>Bạn đã đang bắt đầu tải!<h2/>");
				setTimeout(() => {
					this.isNoticing = false;
					btn.html(`<h2>${this.prog}</h2>`);
					btn.css("background-color", color);
					btn.css("box-shadow", `-1px 2px 33px 1px ${color}`);
				}, 2000);
			}
		});

		ipcRenderer.on(channels.download.progress, (e, progress, size) => {
			this.prog = progress;
			if (!this.isNoticing) {
				var btn = $("#play-button");
				btn.html(`<h2>${progress}<h2/>` + (size == "" ? "" : `<h3>${size}</h3>`));

			}
		});

		ipcRenderer.on(channels.download.finish, (e, d) => {
			var btn = $("#play-button");

			btn.html("<h2>Tải game hoàn tất.<h2/>");
			setTimeout(() => {
				btn.html("<h2>Bắt đầu vào game...<h2/>");
			}, 1000);

			setTimeout(() => {
				btn.html(this.downloadInit);
				btn.css("background-color", color3);
				btn.css("box-shadow", `-1px 2px 33px 1px ${color3}`);
				var window = remote.getCurrentWindow();
				window.hide();
                this.downloading = false;
			}, 3000);
		});

		ipcRenderer.on(channels.game.exited, (e, code) => {
			var window = remote.getCurrentWindow();
			window.show();
			switch(parseInt(code)) {
				case 0:
					break;
				case 1:
					ipcRenderer.send(channels.window.notification, "Đã có lỗi bất ngờ xảy ra!");
					break;
			}
		});
	}

	componentDidMount() {
		$("#play-button").on("click", (e) => {
			e.preventDefault();
            if(this.state.updateAvailable != false) return;
			ipcRenderer.send(channels.download.request, this.state);
		});

		$("#titlebar-close").on("click", (e) => {
			var window = remote.getCurrentWindow();
			window.close();
		});

		$("#titlebar-expand").on("click", (e) => {
			var window = remote.getCurrentWindow();
			if (!window.isMaximized()) window.maximize();
			else window.unmaximize();
		});

		$("#titlebar-minimize").on("click", (e) => {
			var window = remote.getCurrentWindow();
			window.minimize();
		});

		$("#exit-button").on("click", (e) => {
			if (this.downloading || this.isNoticing || this.state.updateAvailable != false) return;
			window.localStorage.removeItem("userdata");
			this.setState({
				redirect: "/"
			});
		});
	}

	componentDidUpdate() {
		window.localStorage.setItem("memory", this.state.memory);
	}

	render() {
		var color = "#35c467";
		if (this.state.redirect) return <Redirect to={this.state.redirect} />;

		return (
			<ContentsWrapper>
				<Titlebar />
				<div className="index">
					<Sidebar />
					<div className="index-main">
						<div className="index-top blur-comming-soon">
							<nav className="index-nav-bar blur-comming-soon">
								<div className="index-nav-item">
									<a>Trang chính</a>
									<div className="index-icon-container">
										<img id="home-icon" />
									</div>
								</div>
								<div className="index-nav-item">
									<a>Liên hệ</a>
									<div class="index-icon-container">
										<img id="contact-icon" />
									</div>
								</div>
								<div className="index-nav-item">
									<a>Về chúng tôi</a>
									<div class="index-icon-container">
										<img id="about-icon" />
									</div>
								</div>
							</nav>
						</div>

						<div className="index-bottom index-bottom-temp">
							<button id="play-button" className="align-middle">
								{this.state.updateAvailable == null ? (
									<h2> Đang kiểm tra update...</h2>
								) : this.state.updateAvailable == true ? (
									<h2> Đang tải update...</h2>
								) : (
									<>
										<h2>VÀO GAME</h2>
										<h3>Phiên bản 1.12.2</h3>
									</>
								)}
							</button>

							<div style={{ marginTop: "60px", textAlign: "center" }}>
								<p>{this.state.memory} MB Memory</p>
								<input
									onChange={(e) => {
										this.setState({ memory: parseInt(e.target.value) });
									}}
									style={{ width: 200 }}
									type="range"
									defaultValue={this.state.memory}
									min={this.minRam}
									max={this.maxRam}
								/>
							</div>
						</div>
					</div>
				</div>
			</ContentsWrapper>
		);
	}
}
