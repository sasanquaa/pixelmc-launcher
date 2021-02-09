const React = require("react");
const { ipcRenderer } = window.require("electron");
const remote = window.require("electron").remote;
import { ContentsWrapper, Wrapper, Titlebar, BouncingBalls } from "./SubComponents";
import SunTornado from "./SunTornado";
import ReactDOMServer from "react-dom/server";
import { Redirect } from "react-router";
import $ from "jquery";
import urljoin from "url-join";

const MSG_FROM_ID = {
	"Auth.form.error.invalid": "Tài khoản không tồn tại hoặc sai mật khẩu.",
	"Auth.form.error.confirmed": "Tài khoản của bạn chưa được kích hoạt.",
	"Auth.form.error.email.taken": "Tài khoản này đã có người đăng ký.",
	"Auth.form.error.user.not-exist": "Email này không tồn tại.",
	"Auth.form.success.register": "Đăng ký tài khoản thành công.",
	"Auth.form.success.forgot": "Đã gửi link reset mật khẩu về email."
};

class LoginCanvas extends React.Component {
	constructor(props) {
		super(props);
		this.last;
		this.points = {};
		this.t = 0;
		this.numPoints = 80;
		this.minSpeed = 10;
		this.maxSpeed = 30;
		this.canvasRef = React.createRef();
		this.unmounted = false;
		window.addEventListener("resize", () => {
			this.canvas.width = window.innerWidth;
			this.canvas.height = window.innerHeight;
			this.ctx.fillStyle = "#d4d4c8";
		});
	}

	componentDidMount() {
		this.last = Date.now();
		this.canvas = this.canvasRef.current;
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		this.ctx = this.canvas.getContext("2d");
		for (var i = 0; i < this.numPoints; i++) {
			this.points[i] = {
				x: Math.random() * window.innerWidth,
				y: Math.random() * window.innerHeight,
				dx: ((this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed)) * Math.PI) / 180,
				dy: this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed),
				size: Math.random() * 12,
				rad: Math.PI / 8 + Math.random() * (Math.PI / 4 - Math.PI / 8),
				phi: Math.PI * 2 * Math.random()
			};
		}
		this.drawCanvas();
	}

	componentWillUnmount() {
		this.unmounted = true;
	}

	tick() {
		var d = (Date.now() - this.last) / 1000;
		this.last = Date.now();
		this.t += d;
		return d;
	}

	isUnmounted() {
		return this.unmounted;
	}

	drawCanvas() {
		this.ctx.fillStyle = "#d4d4c8";

		var moveObject = () => {
			if (this.isUnmounted()) return;

			var delta = this.tick();
			this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

			for (var i = 0; i < this.numPoints; i++) {
				this.points[i].x = this.points[i].x + 0.1 * Math.cos(this.points[i].dx * this.t);
				this.points[i].y = this.points[i].y - this.points[i].dy * delta;
				if (this.points[i].y < -22) this.points[i].y += this.canvas.width;

				var size = ((Math.cos(this.points[i].rad * this.t + this.points[i].phi) + 1) / 2) * this.points[i].size;
				this.ctx.fillRect(this.points[i].x, this.points[i].y, size, size);
			}

			window.requestAnimationFrame(moveObject);
		};

		moveObject();
	}

	render() {
		return (
			<canvas
				ref={this.canvasRef}
				id="login-canvas"
				style={{
					position: "absolute",
					left: 0
				}}
			/>
		);
	}
}

class InputForm extends React.Component {
	constructor(props) {
		super(props);
	}

	messagesCleanup() {
		$("h5").remove(".error-message");
		$("h5").remove(".success-message");
	}

	componentDidMount() {
		var form = $(this.props.formRef.current);
		form.addClass("flyInStart");

		$(this.props.buttonRef.current).on("click", (event) => {
			var invalidFields = form.find(":invalid");

			this.messagesCleanup();

			for (var i = 0; i < invalidFields.length; i++) {
				var msg = $("<h5>", { class: "error-message" });

				switch (invalidFields[i].name) {
					case "email":
						msg.html("Email không hợp lệ.");
						break;
					case "password":
						msg.html("Password không đạt yêu cầu.");
						break;
				}
				msg.insertBefore($(invalidFields[i]).next());
			}

			if (invalidFields.length > 0) {
				invalidFields[0].focus();
			}
		});
	}

	render() {
		return (
			<div ref={this.props.formRef} className="form-input">
				<div className="form-top">{this.props.tops}</div>
				{this.props.inputs}
				<button ref={this.props.buttonRef}>{this.props.buttonMsg}</button>
				<div className="form-options">
					<p onClick={this.props.option1}>{this.props.option1Msg}</p>
					<p onClick={this.props.option2}>{this.props.option2Msg}</p>
				</div>
			</div>
		);
	}
}

export default class Login extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			rotate: -79.2
		};

		this.forgot = this.forgot.bind(this);
		this.register = this.register.bind(this);
		this.login = this.login.bind(this);
		this.messagesCleanup = this.messagesCleanup.bind(this);
		this.playOutAnimation = this.playOutAnimation.bind(this);
		this.mo = new MutationObserver(() => {
			this.messagesCleanup();
			this.inputsCleanup();
		});
		this.form = 0;
		this.formRef = React.createRef();
		this.loginRef = React.createRef();
		this.buttonRef = React.createRef();
		this.x = 100;
		this.host = "https://pixelmc.vn/api";
		this.submitting = false;
	}

	messagesCleanup() {
		$("h5").remove(".error-message");
		$("h5").remove(".success-message");
	}

	inputsCleanup() {
		var inputs = $(this.formRef.current).find("input");
		for (var i = 0; i < inputs.length; i++) {
			inputs[i].value = "";
		}
		$(this.loginRef.current)
			.find("input")
			.on("invalid", (e) => {
				e.preventDefault();
			});
	}

	componentDidMount() {
		if (window.localStorage.getItem("userdata")) {
			this.setState({
				redirect: "/dashboard"
			});
		}

		this.mo.observe(this.loginRef.current, { subtree: true, characterData: true });
		this.inputsCleanup();
		this.messagesCleanup();

		$("#titlebar-close").on("click", function (e) {
			var window = remote.getCurrentWindow();
			window.close();
		});

		$("#titlebar-expand").on("click", function (e) {
			var window = remote.getCurrentWindow();
			if (!window.isMaximized()) window.maximize();
			else window.unmaximize();
		});

		$("#titlebar-minimize").on("click", function (e) {
			var window = remote.getCurrentWindow();
			window.minimize();
		});

		this.timerID = setInterval(() => this.rotate(), 50);
		var login = $(this.loginRef.current);

		login.on("submit", (e) => {
			e.preventDefault();
			var invalidFields = login.find("input");
			this.messagesCleanup();

			if (
				($("#email").val() != null && $.trim($("#email").val()) === "") ||
				($("#password").val() != null && $.trim($("#password").val()) === "") ||
				($("#username").val() != null && $.trim($("#username").val()) === "")
			) {
				var msg = $("<h5>", { class: "error-message" });
				msg.html("Các thông tin không được để trống.");
				msg.insertBefore($(invalidFields[invalidFields.length - 1]).next());

				if (invalidFields.length > 0) {
					invalidFields[0].focus();
				}
			} else {
				if (this.submitting) return;
				var btn = $(this.buttonRef.current);
				var buttonText = btn.text();
				this.submitting = true;
				var f = e.target;
				var method = f.method;
				var url = f.action;
				var data;
				var msg = $("<h5>", { class: "error-message" });
				var msgSuccess = $("<h5>", { class: "success-message" });
				var password;

				/*
                switch(this.form) {
                    case 0:
                        var data = {
                            identifier: f[0].value,
                            password: f[1].value
                        }
                        password = f[1].value;
                        break;
                    case 1:
                        var data = {
                            email: f[0].value
                        }
                        break;
                    case 2:
                        var data = {
                            username: f[0].value,
                            email: f[1].value,
                            password: f[2].value
                        }
                        password = f[2].value;
                        break;
                }
                var request = {
                    url: url,
                    method: method,
                    contentType: 'application/json',
                    data: JSON.stringify(data),
                    success: (data) => {
                        setTimeout( () => {
                            this.submitting = false;
                            btn.html(buttonText);
                            console.log(data)
                            switch(this.form) {
                                case 0:
                                    $(this.formRef.current).removeClass('flyInStart');
                                    $(this.formRef.current).addClass('loginStart');
                                    ipcRenderer.send(window.channels.data.save, {...data.user, password: password});
                                    setTimeout(() => {
                                        $('#transition').addClass('loginBackgroundStart');
                                        setTimeout(() => {
                                            this.setState({
                                                redirect: '/dashboard'
                                            });
                                        }, 800);
                                    }, 600);
                                    break;
                                case 1:
                                    msgSuccess.html(MSG_FROM_ID['Auth.form.success.forgot']);
                                    msgSuccess.insertBefore($(invalidFields[invalidFields.length - 1]).next());
                                    break;
                                case 2:
                                    msgSuccess.html(MSG_FROM_ID['Auth.form.success.register']);
                                    msgSuccess.insertBefore($(invalidFields[invalidFields.length - 1]).next());
                                    break;
                            }
                        }, 1000);
                    },
                    error: (data) => {
                        data = data.responseJSON;
                        setTimeout( () => {
                            btn.html(buttonText);
                            this.submitting = false;
                            var msgID = data.message[0].messages[0].id;
                            msg.html(MSG_FROM_ID[msgID]);
                            msg.insertBefore($(invalidFields[invalidFields.length - 1]).next());
                        }, 1000);
                    }
                }
                */

				setTimeout(() => {
					this.submitting = false;
					btn.html(buttonText);
					$(this.formRef.current).removeClass("flyInStart");
					$(this.formRef.current).addClass("loginStart");
					ipcRenderer.send(window.channels.data.save, { username: $("#username").val() });
					setTimeout(() => {
						$("#transition").addClass("loginBackgroundStart");
						setTimeout(() => {
							this.setState({
								redirect: "/dashboard"
							});
						}, 800);
					}, 600);
				}, 1000);

				btn.html(ReactDOMServer.renderToStaticMarkup(<BouncingBalls />));
				return;
				//$.ajax(request);
			}
		});
	}

	componentWillUnmount() {
		clearInterval(this.timerID);
		this.messagesCleanup();
		this.inputsCleanup();
		console.log("[DEBUG] Login page unloaded.");
	}

	async login() {
		this.playOutAnimation(0);
	}

	async forgot() {
		this.playOutAnimation(1);
	}

	async register() {
		this.playOutAnimation(2);
	}

	playOutAnimation(form) {
		if (this.submitting) return;
		$(this.formRef.current).addClass("flyOutStart");

		setTimeout(() => {
			$(this.formRef.current).removeClass("flyOutStart");
			this.form = form;
		}, this.x);
	}

	rotate() {
		this.setState({
			rotate: this.state.rotate + 0.1
		});
	}

	render() {
		if (this.state.redirect) return <Redirect to={this.state.redirect} />;

		var rot = "rotate(" + this.state.rotate + ", 0, 0)";
		var svg = encodeURIComponent(ReactDOMServer.renderToStaticMarkup(<SunTornado rotate={rot} />));
		var comp = `url('data:image/svg+xml;utf8, ${svg}')`;
		var form;
		var method = "post";
		var action;
		var inputs = [
			<input name="username" id="username" type="text" placeholder="Tên tài khoản"></input>,
			//<input name='email' id='email' type='text' pattern="^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$" placeholder='Địa chỉ Email'></input>,
			<br />,
			<br />
			/*
                <input name='password' id='password' type='password' placeholder='Mật khẩu' pattern='^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$'></input>,
                <br/>,
                <br/>
                */
		];
		switch (this.form) {
			case 0:
				var tops = [<h1>Chào mừng bạn!</h1>, <h2>Hãy đăng nhập hoặc đăng ký tài khoản.</h2>];
				form = (
					<InputForm
						tops={tops}
						inputs={inputs}
						buttonRef={this.buttonRef}
						formRef={this.formRef}
						option1={this.forgot}
						option2={this.register}
						//option1Msg="Quên mật khẩu?"
						//option2Msg="Đăng ký tài khoản"
						buttonMsg="Đăng nhập"
					/>
				);
				action = urljoin(this.host, "auth", "local");
				break;
			case 1:
				inputs = inputs.splice(0, 3);
				var tops = [<h1>Lấy lại tài khoản</h1>, <h2>Hãy nhập vào email và tên trong game của bạn.</h2>];
				form = (
					<InputForm
						tops={tops}
						inputs={inputs}
						buttonRef={this.buttonRef}
						formRef={this.formRef}
						option1={this.login}
						option2={this.register}
						option1Msg="Đăng nhập"
						option2Msg="Đăng ký tài khoản"
						buttonMsg="Reset mật khẩu"
					/>
				);
				action = urljoin(this.host, "auth", "forgot-password");
				break;
			case 2:
				var tops = [
					<h1>Đăng ký tài khoản</h1>,
					<h2>Hãy nhập vào thông tin của bạn.</h2>,
					<h2>Password bao gồm chữ và số, cần ít nhất 1 ký tự viết hoa.</h2>
				];
				inputs.splice(0, 0, <br />);
				inputs.splice(0, 0, <br />);
				inputs.splice(
					0,
					0,
					<input name="username" id="username" type="text" placeholder="Tên in-game"></input>
				);
				form = (
					<InputForm
						tops={tops}
						inputs={inputs}
						buttonRef={this.buttonRef}
						formRef={this.formRef}
						option1={this.forgot}
						option2={this.login}
						option1Msg="Quên mật khẩu?"
						option2Msg="Đăng nhập"
						buttonMsg="Đăng ký"
					/>
				);
				action = urljoin(this.host, "auth", "local", "register");
				break;
		}

		return (
			<ContentsWrapper>
				<Titlebar />
				<form
					title=""
					ref={this.loginRef}
					method={method}
					action={action}
					className="login-form"
					style={{
						backgroundImage: comp
					}}
				>
					<Wrapper>
						<div id="input-container" className="login-input-container">
							<LoginCanvas />
							{form}
						</div>
					</Wrapper>
				</form>
				<div id="transition"></div>
			</ContentsWrapper>
		);
	}
}
