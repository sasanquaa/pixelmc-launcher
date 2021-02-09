import React from "react";
import PropTypes from "prop-types";

const XSquare = (props) => {
	const { color, size, ...otherProps } = props;
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			viewBox="0 0 12 12"
			fill="none"
			stroke={color}
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
			{...otherProps}
		>
			{/*<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />*/}
			<line x1="2.5" y1="3" x2="8.5" y2="9" />
			<line x1="8.5" y1="3" x2="2.5" y2="9" />
		</svg>
	);
};

XSquare.propTypes = {
	color: PropTypes.string,
	size: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

XSquare.defaultProps = {
	color: "#f7f7de",
	size: "22"
};

export default XSquare;
