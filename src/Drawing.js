"use strict";

class Drawing {

	static table(data, options = {}) {
		let spacing = options.spacing || 3;
		let border  = options.border  || Drawing.BORDER_LINE;
		let sort    = options.sort    || null;

		let headers = data[0];
		if(options.headers !== false)
			data.splice(0, 1);

		if(sort !== null) {
			let sorter = (a, b) => {
				if(a[sort] < b[sort]) return -1;
				if(a[sort] > b[sort]) return 1;
				return 0;
			};
			data.sort(typeof sort == 'function' ? sort : sorter);
		}

		let table_width = 0;
		let column_widths = new Array(headers.length);
		for(let x = 0; x < headers.length; x++) {
			let width = headers[x].length;
			for(let y = 0; y < data.length; y++) {
				if(width < data[y][x].length)
					width = data[y][x].length;
			}
			column_widths[x] = width;
			table_width += width + spacing;
		}

		let output_string = "";

		if(border[2] != "")
			output_string += border[1] + Drawing.line(table_width + 2, border[2]) + border[3] + "\n";

		if(options.headers !== false) {
			output_string += border[4] + " ";
			for(let x = 0; x < headers.length; x++)
				output_string += Drawing.pad(headers[x], column_widths[x] + spacing);
			output_string += " " + border[5] + "\n";

			output_string += border[4] + Drawing.line(table_width + 2, border[0]) + border[5] + "\n";
		}

		for(let y = 0; y < data.length; y++) {
			output_string += border[4] + " ";
			for(let x = 0; x < headers.length; x++)
				output_string += Drawing.pad(data[y][x], column_widths[x] + spacing);

			output_string += " " + border[5] + "\n";
		}

		if(border[7] != "")
			output_string += border[6] + Drawing.line(table_width + 2, border[7]) + border[8] + "\n";

		return output_string;
	}

	static line(length, char = '-') {
		return Drawing.pad("", length, char);
	}

	static pad(string, length, char = " ", left = false) {
		let pad = new Array(length + 1).join(char);

		if(typeof string == 'undefined')
			return pad;

		if(left == true)
			return (pad + string).slice(-pad.length);

		return (string + pad).substring(0, pad.length);
	}
}

// Borders are in the format: [seperator, top-left, top, top-right, left, right, bottom-left, bottom, bottom-right]
Drawing.BORDER_NONE   = ["-",  "",   "",   "",   "",   "",   "",   "",   ""  ]
Drawing.BORDER_LINE   = ["-",  ".",  "-",  ".",  "|",  "|",  "'",  "-",  "'" ];
Drawing.BORDER_SOLID  = ["#",  "#",  "#",  "#",  "#",  "#",  "#",  "#",  "#" ];
Drawing.BORDER_DANGER = ["!",  "!!", "!",  "!!", "!!", "!!", "!!", "!",  "!!"];

module.exports = Drawing;
