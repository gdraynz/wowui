import React, { useState, useRef, useEffect } from "react";
import { Table, Button, Icon, Dropdown, Tab } from "semantic-ui-react";
import _ from "lodash";

import { AddonStore } from "../Store";

const ipcRenderer = window.require("electron").ipcRenderer;
const fs = window.require("fs");
const extract = window.require("extract-zip");

const updateAddon = async (id, currentVersion) => {
	const response = await fetch(
		"https://api.mmoui.com/v3/game/WOW/filedetails/" + id + ".json"
	);
	const data = await response.json();
	const addon = data[0];
	AddonStore.set("addons.wi." + id, {
		id: id,
		name: addon.UIName,
		downloadUrl: addon.UIDownload,
		version: currentVersion || addon.UIVersion,
		author: addon.UIAuthorName,
		downloads: addon.UIHitCount
	});
	return addon.UIVersion;
};

const Addon = props => {
	const [loading, setLoading] = useState(false);
	const refName = useRef(props.name);
	const refUrl = useRef(props.url);
	const refVersion = useRef(props.version);
	const refAuthor = useRef(props.author);
	const refDownloads = useRef(props.downloads);
	const refLatestVersion = useRef(props.version);

	useEffect(() => {
		setLoading(true);
		updateAddon(props.id, props.version).then(v => {
			refLatestVersion.current = v;
			setLoading(false);
		});
	}, [props.id, props.version]);

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
				refVersion.current = refLatestVersion.current;
				AddonStore.set("addons.wi." + props.id, {
					id: props.id,
					name: refName.current,
					downloadUrl: refUrl.current,
					version: refVersion.current,
					author: refAuthor.current,
					downloads: refDownloads.current
				});
				setLoading(false);
			});
		});
	};

	const installButton =
		refLatestVersion.current !== props.version ? (
			// Update available
			<Button
				color="blue"
				loading={loading}
				disabled={loading}
				onClick={() => install()}
			>
				<Icon name="download" />
				{props.version + " -> " + refLatestVersion.current}
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
					onClick={() => AddonStore.delete("addons.wi." + props.id)}
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
				{installButton}
			</Table.Cell>
		</Table.Row>
	);
};

const AddonSearch = props => {
	const [loading, setLoading] = useState(false);

	const customSearch = (options, query) => {
		if (query.length < 2) {
			return [];
		}
		const re = new RegExp(_.escapeRegExp(query), "i");
		return props.addonList.filter(item => re.test(item.text));
	};

	const fetchAddon = id => {
		setLoading(true);
		updateAddon(id, null).then(v => {
			setLoading(false);
		});
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
		/>
	);
};

export const WITab = props => {
	const [addons, setAddons] = useState([]);
	const [addonList, setAddonList] = useState([]);

	AddonStore.onDidChange("addons.wi", (newValue, oldValue) => {
		if (newValue) setAddons(Object.values(newValue));
	});

	useEffect(() => {
		setAddons(Object.values(AddonStore.get("addons.wi", {})));
		fetch("https://api.mmoui.com/v3/game/WOW/filelist.json")
			.then(response => response.json())
			.then(data =>
				setAddonList(
					data.map(item => ({
						key: item.UID,
						value: item.UID,
						text: item.UIName
					}))
				)
			);
	}, []);

	return (
		<Tab.Pane {...props}>
			<AddonSearch addonList={addonList} />
			<Table selectable celled>
				<Table.Header>
					<Table.Row>
						<Table.HeaderCell />
						<Table.HeaderCell>Name</Table.HeaderCell>
						<Table.HeaderCell collapsing>Author</Table.HeaderCell>
						<Table.HeaderCell collapsing textAlign="center">
							Downloads
						</Table.HeaderCell>
						<Table.HeaderCell collapsing textAlign="center" />
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{addons.map(addon => (
						<Addon key={addon.id} {...addon} />
					))}
				</Table.Body>
			</Table>
		</Tab.Pane>
	);
};
