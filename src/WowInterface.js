import React, { useState, useRef, useEffect } from "react";
import { Table, Button, Icon, Dropdown } from "semantic-ui-react";
import _ from "lodash";

import { AddonStore } from "./Store";

const ipcRenderer = window.require("electron").ipcRenderer;
const fs = window.require("fs");
const extract = window.require("extract-zip");

export const WIAddon = props => {
	const [loading, setLoading] = useState(false);
	const refName = useRef(props.name);
	const refUrl = useRef(props.url);
	const refVersion = useRef(props.version);
	const refAuthor = useRef(props.author);
	const refDownloads = useRef(props.downloads);
	const refMDownloads = useRef(props.mDownloads);
	const [latestVersion, setLatestVersion] = useState(props.version);

	useEffect(() => {
		setLoading(true);
		fetch(
			"https://api.mmoui.com/v3/game/WOW/filedetails/" +
				props.id +
				".json"
		)
			.then(response => response.json())
			.then(data => data[0])
			.then(addon => {
				refName.current = addon.UIName;
				refUrl.current = addon.UIDownload;
				refAuthor.current = addon.UIAuthorName;
				refDownloads.current = addon.UIHitCount;
				refMDownloads.current = addon.UIHitCountMonthly;
				setLatestVersion(addon.UIVersion);
			})
			.then(() => {
				AddonStore.set("addons." + props.id, {
					id: props.id,
					name: refName.current,
					downloadUrl: refUrl.current,
					version: refVersion.current,
					author: refAuthor.current,
					downloads: refDownloads.current,
					mDownloads: refMDownloads.current
				});
			})
			.then(() => setLoading(false));
	}, [props.id]);

	const install = () => {
		setLoading(true);
		ipcRenderer.send("download", {
			url: refUrl.current,
			properties: { directory: AddonStore.get("path") }
		});
		ipcRenderer.on("download complete", (event, file) => {
			extract(file, { dir: AddonStore.get("path") }, err => {
				if (err) console.log(err);
				// Cleanup zip file silently
				setTimeout(() => {
					try {
						fs.unlinkSync(file);
					} catch (err) {}
				}, 1000);
				refVersion.current = latestVersion;
				AddonStore.set("addons." + props.id, {
					id: props.id,
					name: refName.current,
					downloadUrl: refUrl.current,
					version: refVersion.current,
					author: refAuthor.current,
					downloads: refDownloads.current,
					mDownloads: refMDownloads.current
				});
				setLoading(false);
			});
		});
	};

	const installButton =
		latestVersion !== props.version ? (
			// Update available
			<Button
				color="blue"
				loading={loading}
				disabled={loading}
				onClick={() => install()}
			>
				<Icon name="download" />
				{props.version + " -> " + latestVersion}
			</Button>
		) : (
			<Button
				color="green"
				loading={loading}
				disabled={loading}
				onClick={() => install()}
			>
				<Icon name="download" />
				{props.version}
			</Button>
		);

	return (
		<Table.Row>
			<Table.Cell collapsing>
				<Button
					color="red"
					icon="trash alternate"
					onClick={() => AddonStore.delete("addons." + props.id)}
				/>
			</Table.Cell>
			<Table.Cell>{refName.current}</Table.Cell>
			<Table.Cell collapsing textAlign="center">
				{refAuthor.current}
			</Table.Cell>
			<Table.Cell collapsing textAlign="center">
				{refDownloads.current}
			</Table.Cell>
			<Table.Cell collapsing textAlign="center">
				{refMDownloads.current}
			</Table.Cell>
			<Table.Cell collapsing textAlign="center">
				{installButton}
			</Table.Cell>
		</Table.Row>
	);
};

export const WIAddonSearch = props => {
	const [loading, setLoading] = useState(false);
	const { addonList, ...childProps } = props;

	const customSearch = (options, query) => {
		if (query.length < 2) {
			return [];
		}
		const re = new RegExp(_.escapeRegExp(query), "i");
		return addonList.filter(item => re.test(item.text));
	};

	const fetchAddon = async uid => {
		setLoading(true);
		const response = await fetch(
			"https://api.mmoui.com/v3/game/WOW/filedetails/" + uid + ".json"
		);
		let data = await response.json();
		data = data[0];
		AddonStore.set("addons." + data.UID, {
			id: data.UID,
			name: data.UIName,
			downloadUrl: data.UIDownload,
			version: data.UIVersion,
			author: data.UIAuthorName,
			downloads: data.UIDownloadTotal,
			mDownloads: data.UIDownloadMonthly
		});
		setLoading(false);
	};

	return (
		<Dropdown
			fluid
			selection
			options={[]}
			search={customSearch}
			loading={loading}
			minCharacters={2}
			placeholder="Search addon"
			onChange={(_, { value }) => fetchAddon(value)}
			{...childProps}
		/>
	);
};
