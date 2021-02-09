import React from "react";
import PropTypes from "prop-types";

export default function MinimizeRounded(props) {
	return (
		<svg aria-hidden="false" width="12" height="12" viewBox="0 0 12 12">
			<rect fill={props.color} width="10" height="1" x="1" y="6"></rect>
		</svg>
	);
}

MinimizeRounded.propTypes = {
	color: PropTypes.string
};

MinimizeRounded.defaultProps = {
	color: "#f7f7de"
};
