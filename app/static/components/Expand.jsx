import React from "react";
import PropTypes from "prop-types";

export default function Expand(props) {
	return (
		<svg aria-hidden="false" width="12" height="12" viewBox="0 0 12 12">
			<rect width="9" height="9" x="1.5" y="1.5" fill="none" stroke={props.color}></rect>
		</svg>
	);
}

Expand.propTypes = {
	color: PropTypes.string
};

Expand.defaultProps = {
	color: "#f7f7de"
};
