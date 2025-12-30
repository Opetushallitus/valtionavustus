import React, { useEffect, useState } from "react";
import _ from "lodash";
import * as Bacon from "baconjs";

import DateUtil from "soresu-form/web/DateUtil";
import HttpUtil from "soresu-form/web/HttpUtil";

import PaatosUrl from "../../PaatosUrl";
import HelpTooltip from "../../common-components/HelpTooltip";
import { Kayttoaika } from "./Kayttoaika";
import { SelvityksienAikarajat } from "./SelvityksienAikarajat";
import { Lahetys, Tapahtumaloki } from "./Tapahtumaloki";
import { LastUpdated } from "./LastUpdated";
import {
	DecisionLiite,
	HelpTexts,
	Language,
	Liite,
	LiiteAttachment,
	LiiteAttachmentVersion,
} from "soresu-form/web/va/types";
import { EnvironmentApiResponse } from "soresu-form/web/va/types/environment";
import {
	VirkailijaAvustushaku,
	selectLoadedInitialData,
	updateField,
} from "../hakuReducer";
import {
	useHakujenHallintaDispatch,
	useHakujenHallintaSelector,
} from "../hakujenHallintaStore";
import {
	tryToUseCurrentAvustushaku,
	useCurrentAvustushaku,
} from "../useAvustushaku";
import ChooseAvustushaku from "./ChooseAvustushaku";

interface DecisionProps {
	title: string;
	avustushaku: VirkailijaAvustushaku;
	id: string;
	onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
	helpText?: string;
	dataTestId?: string;
	language: Language;
	disabled: boolean;
}

const DecisionField: React.FC<DecisionProps> = ({
	avustushaku,
	title,
	id,
	language,
	onChange,
	helpText,
	dataTestId,
	disabled,
}) => {
	const fieldId = `decision.${id}.${language}`;
	const value = _.get(avustushaku, fieldId, "");
	const titleLanguage = language === "sv" ? `${title} ruotsiksi` : title;
	return (
		<div className="decision-column" data-test-id={dataTestId}>
			<label>
				{titleLanguage}
				{helpText && language === "fi" ? (
					<HelpTooltip content={helpText} direction="left" />
				) : (
					""
				)}
			</label>
			<textarea
				disabled={disabled}
				onChange={onChange}
				rows={5}
				id={fieldId}
				value={value}
			/>
		</div>
	);
};

const DecisionFields: React.FC<Omit<DecisionProps, "language">> = ({
	title,
	avustushaku,
	id,
	onChange,
	helpText,
	dataTestId,
	disabled,
}) => (
	<div className="decision-row">
		<DecisionField
			title={title}
			avustushaku={avustushaku}
			id={id}
			language="fi"
			onChange={onChange}
			helpText={helpText}
			dataTestId={dataTestId}
			disabled={disabled}
		/>
		<DecisionField
			title={title}
			avustushaku={avustushaku}
			id={id}
			language="sv"
			onChange={onChange}
			helpText={helpText}
			dataTestId={dataTestId}
			disabled={disabled}
		/>
	</div>
);

interface DateFieldProps {
	avustushaku: VirkailijaAvustushaku;
	field: "maksudate" | "date";
	label: string;
	helpTexts: HelpTexts;
	disabled: boolean;
}

interface DateFieldState {
	currentAvustushakuId: number;
	value: any;
}

const DateField = (props: DateFieldProps) => {
	const dispatch = useHakujenHallintaDispatch();
	const getInitialState = (): DateFieldState => {
		return {
			currentAvustushakuId: props.avustushaku.id,
			value: props.avustushaku.decision?.[props.field] || "",
		};
	};
	const [state, setState] = useState<DateFieldState>(getInitialState);
	useEffect(() => {
		if (props.avustushaku.id !== state.currentAvustushakuId) {
			setState(getInitialState());
		}
	}, [props.avustushaku.id, state.currentAvustushakuId]);

	const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setState((state) => ({ ...state, value: event.target.value }));
		dispatch(
			updateField({
				avustushaku: props.avustushaku,
				field: event.target,
				newValue: event.target.value,
			}),
		);
	};

	return (
		<div className="decision-date">
			<div className="decision-column">
				<span className="decision-date-label" data-test-id="ratkaisupäivä">
					{props.label}
					<HelpTooltip
						content={
							props.helpTexts["hakujen_hallinta__päätös___ratkaisupäivä"]
						}
						direction="left"
					/>
				</span>
				<input
					type="text"
					value={state.value}
					id={`decision.${props.field}`}
					onChange={onChange}
					disabled={props.disabled}
				/>
			</div>
		</div>
	);
};

const LiiteGroup = ({
	liite,
	helpTexts,
	selectedLiitteet,
	selectedVersions,
	onChangeLiite,
	onChangeLiiteVersions,
	disabled,
}: {
	liite: Liite;
	helpTexts: HelpTexts;
	selectedLiitteet: Record<string, string>;
	selectedVersions: Record<string, string | undefined>;
	onChangeLiite: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onChangeLiiteVersions: (e: React.ChangeEvent<HTMLInputElement>) => void;
	disabled: boolean;
}) => {
	return (
		<div key={liite.group}>
			<h5>
				{liite.group}
				<HelpTooltip
					content={
						helpTexts[
							`hakujen_hallinta__päätös___${liite.group.toLowerCase().replace(/ /g, "_")}`
						]
					}
					direction="left"
				/>
			</h5>
			{liite.attachments.map((attachment) => (
				<LiiteComponent
					key={attachment.id}
					attachment={attachment}
					groupId={liite.group}
					selectedLiitteet={selectedLiitteet}
					selectedVersions={selectedVersions}
					onChangeLiite={onChangeLiite}
					onChangeLiiteVersions={onChangeLiiteVersions}
					disabled={disabled}
				/>
			))}
		</div>
	);
};

const PakoteLiite = () => {
	const dispatch = useHakujenHallintaDispatch();
	const { environment, helpTexts } = useHakujenHallintaSelector((state) =>
		selectLoadedInitialData(state),
	);
	const loadingAvustushaku = useHakujenHallintaSelector(
		(state) => state.haku.loadStatus.loadingAvustushaku,
	);
	const avustushaku = useCurrentAvustushaku();
	const key = "dont-include-pakote-ohje";
	const dontIncludePakoteOhje = avustushaku.decision?.[key] === true;
	const hakijaUrl = environment["hakija-server"].url["fi"];
	const linkUrl = `${hakijaUrl}liitteet/va_pakoteohje.pdf`;
	return (
		<div>
			<h5>
				Pakoteohje
				<HelpTooltip
					content={helpTexts["hakujen_hallinta__päätös___pakoteohjeet"]}
					direction="left"
				/>
			</h5>
			<div className="decision-liite-selection__liite">
				<label>
					<input
						type="checkbox"
						className="decision-liite-selection__liite-input"
						checked={!dontIncludePakoteOhje}
						disabled={loadingAvustushaku}
						onChange={() =>
							dispatch(
								updateField({
									avustushaku,
									field: { id: `decision.${key}` },
									newValue: !dontIncludePakoteOhje,
								}),
							)
						}
					/>
					Pakotteiden huomioon ottaminen valtionavustustoiminnassa{" "}
				</label>
				<span>
					<a
						className="decision-liite-selection__link"
						href={linkUrl}
						target="_blank"
						rel="noopener noreferrer"
					>
						fi/sv
					</a>
				</span>
			</div>
		</div>
	);
};

const AttachmentLiite = ({
	attachment,
	isSelected,
	onChangeLiiteVersions,
	selectedVersions,
	disabled,
}: {
	attachment: LiiteAttachment;
	isSelected: boolean;
	selectedLiitteet: Record<string, string>;
	selectedVersions: Record<string, string | undefined>;
	onChangeLiiteVersions: (e: React.ChangeEvent<HTMLInputElement>) => void;
	disabled?: boolean;
}) => {
	const { environment } = useHakujenHallintaSelector(selectLoadedInitialData);
	const disableOldVersions = attachment.id === "va_yleisohje";
	const showAllAvailableVersions = attachment.id === "jotpa_vakioehdot";
	const amountOfVersions = attachment.versions.length;
	if (attachment.versions.length > 1 || showAllAvailableVersions) {
		return (
			<div>
				{attachment.versions.map((v, index) => (
					<LiiteVersion
						key={`liiteversion-${v.id}`}
						attachment={attachment}
						isLiiteSelected={
							isSelected && selectedVersions[attachment.id] === v.id
						}
						isDisabled={
							disabled ||
							(disableOldVersions ? index + 1 < amountOfVersions : undefined)
						}
						versionSpec={v}
						environment={environment}
						onChangeLiiteVersions={onChangeLiiteVersions}
					/>
				))}
			</div>
		);
	}
	return (
		<LiiteVersionLinks
			attachmentId={attachment.id}
			versionSuffix={attachment.versions[0].id}
			environment={environment}
		/>
	);
};

const LiiteComponent = ({
	attachment,
	groupId,
	selectedLiitteet,
	selectedVersions,
	onChangeLiite,
	onChangeLiiteVersions,
	disabled,
}: {
	attachment: LiiteAttachment;
	groupId: string;
	selectedLiitteet: Record<string, string>;
	selectedVersions: Record<string, string | undefined>;
	onChangeLiite: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onChangeLiiteVersions: (e: React.ChangeEvent<HTMLInputElement>) => void;
	disabled: boolean;
}) => {
	const isSelected = selectedLiitteet[groupId] === attachment.id;
	return (
		<div key={attachment.id} className="decision-liite-selection__liite">
			<label>
				<input
					type="checkbox"
					className="decision-liite-selection__liite-input"
					data-group={groupId}
					name={"decision-liite-group--" + groupId}
					value={attachment.id}
					checked={isSelected}
					onChange={onChangeLiite}
					disabled={disabled}
				/>
				{attachment.langs.fi}{" "}
				<span className="decision-liite-selection__liite-id">
					{attachment.id}
				</span>
			</label>
			<AttachmentLiite
				attachment={attachment}
				isSelected={isSelected}
				selectedLiitteet={selectedLiitteet}
				selectedVersions={selectedVersions}
				disabled={disabled}
				onChangeLiiteVersions={onChangeLiiteVersions}
			/>
		</div>
	);
};

const LiiteVersion = ({
	attachment,
	isLiiteSelected,
	versionSpec,
	environment,
	isDisabled,
	onChangeLiiteVersions,
}: {
	attachment: LiiteAttachment;
	isLiiteSelected: boolean;
	versionSpec: LiiteAttachmentVersion;
	environment: EnvironmentApiResponse;
	isDisabled?: boolean;
	onChangeLiiteVersions: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
	const disabled = isDisabled || !isLiiteSelected;
	return (
		<div className="decision-liite-selection__liite-version">
			<label
				key={"v" + versionSpec.id}
				className={disabled ? "disabled" : undefined}
			>
				<input
					type="radio"
					className="decision-liite-selection__liite-version-input"
					data-liite={attachment.id}
					name={"decision-liite-version--" + attachment.id}
					value={versionSpec.id}
					checked={isLiiteSelected}
					onChange={onChangeLiiteVersions}
					disabled={disabled}
				/>
				{versionSpec.description}
			</label>
			<LiiteVersionLinks
				attachmentId={attachment.id}
				versionSuffix={versionSpec.id}
				environment={environment}
			/>
		</div>
	);
};

interface LiiteVersionLinkProps {
	attachmentId: string;
	versionSuffix: string;
	environment: EnvironmentApiResponse;
}

const languages = ["fi", "sv"] as const;

const LiiteVersionLinks = ({
	attachmentId,
	versionSuffix,
	environment,
}: LiiteVersionLinkProps) => {
	return (
		<span>
			{languages.map((lang) => {
				const hakijaUrl = environment["hakija-server"].url[lang];
				const linkUrl = `${hakijaUrl}liitteet/${attachmentId}${versionSuffix}_${lang}.pdf`;
				return (
					<a
						key={lang}
						className="decision-liite-selection__link"
						href={linkUrl}
						target="_blank"
						rel="noopener noreferrer"
					>
						{lang}
					</a>
				);
			})}
		</span>
	);
};

const makeSelectedLiitteet = (
	available: Liite[],
	selectedLiitteet: DecisionLiite[],
) => {
	const findAvailableLiite = (
		liite: DecisionLiite,
	): LiiteAttachment | undefined => {
		const foundGroup = available.find((l) => l.group === liite.group);
		if (!foundGroup) {
			return undefined;
		}
		return foundGroup.attachments.find((l) => l.id === liite.id);
	};

	return selectedLiitteet.reduce<Record<string, string>>((acc, l) => {
		const foundSelected = findAvailableLiite(l);
		if (foundSelected) {
			acc[l.group] = foundSelected.id;
		}
		return acc;
	}, {});
};

const makeSelectedVersions = (
	decisionLiitteet: Liite[],
	selectedLiitteet: DecisionLiite[],
) => {
	const candidateVersionsInSelectedLiitteet = selectedLiitteet.reduce<
		Record<string, string>
	>((acc, l) => {
		acc[l.id] = l.version;
		return acc;
	}, {});

	return decisionLiitteet.reduce<Record<string, string | undefined>>(
		(acc, g) => {
			_.forEach(g.attachments, (a) => {
				const userSelectedVersion = candidateVersionsInSelectedLiitteet[a.id];
				const isVersionAvailable =
					userSelectedVersion !== undefined &&
					_.find(a.versions, (v) => v.id === userSelectedVersion) !== undefined;
				acc[a.id] = isVersionAvailable
					? userSelectedVersion
					: _.last(a.versions)?.id;
			});
			return acc;
		},
		{},
	);
};

interface LiitteetSelectionProps {
	avustushaku: VirkailijaAvustushaku;
	decisionLiitteet: Liite[];
	helpTexts: HelpTexts;
	disabled: boolean;
}

interface LiitteetSelectionState {
	selectedLiitteet: Record<string, string>;
	selectedVersions: Record<string, string | undefined>;
}

const LiitteetSelection = ({
	avustushaku,
	decisionLiitteet,
	helpTexts,
	disabled,
}: LiitteetSelectionProps) => {
	const [selectedLiitteet, setSelectedLiitteet] = useState(() =>
		makeSelectedLiitteet(
			decisionLiitteet,
			avustushaku?.decision?.liitteet ?? [],
		),
	);
	const [selectedVersions, setSelectedVersions] = useState(() =>
		makeSelectedVersions(
			decisionLiitteet,
			avustushaku?.decision?.liitteet ?? [],
		),
	);

	useEffect(() => {
		setSelectedLiitteet(
			makeSelectedLiitteet(
				decisionLiitteet,
				avustushaku?.decision?.liitteet ?? [],
			),
		);
		setSelectedVersions(
			makeSelectedVersions(
				decisionLiitteet,
				avustushaku?.decision?.liitteet ?? [],
			),
		);
	}, [avustushaku.id]);

	const dispatch = useHakujenHallintaDispatch();

	const updateSelectedLiitteet = (
		selectedLiitteet: LiitteetSelectionState["selectedLiitteet"],
		selectedVersions: LiitteetSelectionState["selectedVersions"],
	) => {
		const liitteet = _.map(selectedLiitteet, (liiteId, groupId) => ({
			group: groupId,
			id: liiteId,
			version: selectedVersions[liiteId],
		}));
		dispatch(
			updateField({
				avustushaku,
				field: { id: "decision.liitteet" },
				newValue: liitteet as any,
			}),
		);
	};

	const onChangeLiite = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { value: liiteId, checked: isChecked } = event.target;
		const liiteGroup = event.target.dataset.group;
		if (liiteGroup) {
			const newSelectedLiitteet = isChecked
				? _.assign({}, selectedLiitteet, { [liiteGroup]: liiteId })
				: _.omit(selectedLiitteet, [liiteGroup]);
			updateSelectedLiitteet(newSelectedLiitteet, selectedVersions);
			setSelectedLiitteet(newSelectedLiitteet);
		}
	};

	const onChangeLiiteVersion = (event: React.ChangeEvent<HTMLInputElement>) => {
		const versionId = event.target.value;
		const liiteId = event.target.dataset.liite;
		if (liiteId) {
			const newSelectedVersions = _.assign({}, selectedVersions, {
				[liiteId]: versionId,
			});
			updateSelectedLiitteet(selectedLiitteet, newSelectedVersions);
			setSelectedVersions(newSelectedVersions);
		}
	};

	return (
		<div>
			<h4 data-test-id="paatoksenliitteet">
				Päätöksen liitteet
				<HelpTooltip
					content={helpTexts["hakujen_hallinta__päätös___päätöksen_liitteet"]}
					direction="left"
				/>
			</h4>
			<div className="decision-liite-selection">
				{decisionLiitteet.map((liite) => (
					<LiiteGroup
						key={`Liitegroup-${liite.group}`}
						liite={liite}
						selectedLiitteet={selectedLiitteet}
						helpTexts={helpTexts}
						onChangeLiite={onChangeLiite}
						selectedVersions={selectedVersions}
						onChangeLiiteVersions={onChangeLiiteVersion}
						disabled={disabled}
					/>
				))}
			</div>
		</div>
	);
};

interface RegenerateDecisionsProps {
	avustushaku: VirkailijaAvustushaku;
	helpTexts: HelpTexts;
}

interface RegenerateDecisionState {
	completed: boolean;
	confirm: boolean;
	regenerating?: boolean;
}

class RegenerateDecisions extends React.Component<
	RegenerateDecisionsProps,
	RegenerateDecisionState
> {
	constructor(props: RegenerateDecisionsProps) {
		super(props);
		this.state = { completed: false, confirm: false };
	}

	render() {
		const avustushaku = this.props.avustushaku;

		const onConfirm = () => {
			this.setState({ confirm: true });
		};

		const onRegenerate = () => {
			this.setState({ regenerating: true });
			const sendS = Bacon.fromPromise(
				HttpUtil.post(`/api/paatos/regenerate/${avustushaku.id}`, {}),
			);
			sendS.onValue(() => {
				this.setState({ completed: true });
			});
		};

		const regenerating = this.state.regenerating;
		return (
			<div>
				{this.state.completed && (
					<div style={{ fontWeight: "bold", marginBottom: 10, marginTop: 10 }}>
						Päätökset luotu uudelleen
					</div>
				)}
				{!this.state.completed && (
					<div>
						{this.state.confirm && (
							<button onClick={onRegenerate} disabled={regenerating}>
								{regenerating ? "Vahvistetaan" : "Vahvista päätösten luominen"}
							</button>
						)}
						{!this.state.confirm && (
							<button onClick={onConfirm}>
								Luo päätökset uudelleen
								<HelpTooltip
									content={
										this.props.helpTexts[
											"hakujen_hallinta__päätös___luo_päätökset_uudelleen"
										]
									}
									direction="left"
								/>
							</button>
						)}
					</div>
				)}
			</div>
		);
	}
}

interface ResendDecisionProps {
	avustushaku: VirkailijaAvustushaku;
	helpTexts: HelpTexts;
	reload: () => void;
	sent?: number;
}

interface ResendDecisionsState {
	completed: boolean;
	confirm: boolean;
	resending?: boolean;
	resendError?: string;
}

class ResendDecisions extends React.Component<
	ResendDecisionProps,
	ResendDecisionsState
> {
	state: ResendDecisionsState = { completed: false, confirm: false };

	render() {
		const avustushaku = this.props.avustushaku;

		const onConfirm = () => {
			this.setState({ confirm: true });
		};

		const onResend = () => {
			this.setState({
				resending: true,
				resendError: undefined,
				completed: false,
			});
			const sendS = Bacon.fromPromise(
				HttpUtil.post(`/api/paatos/resendall/${avustushaku.id}`, {}),
			);
			sendS.onValue(() => {
				this.setState({ completed: true, resending: false });
				this.props.reload();
			});
			sendS.onError((err) => {
				const setPäätösResendError = (errorText: string) =>
					this.setState({
						resending: false,
						resendError: errorText,
						confirm: false,
					});
				if (err.name === "HttpResponseError" && err.response.status === 400) {
					setPäätösResendError(err.response.data.error);
				} else {
					setPäätösResendError(
						"Odottamaton virhe tapahtui lähettäessä päätöksiä",
					);
				}
				this.props.reload();
			});
		};

		const resending = this.state.resending;
		return (
			<div>
				{this.state.resending && (
					<div>
						<img src="/virkailija/img/ajax-loader.gif" />
						&nbsp;<strong>Päätöksiä lähetetään uudelleen...</strong>
					</div>
				)}
				{this.state.completed && (
					<div
						style={{ fontWeight: "bold", marginBottom: 10, marginTop: 10 }}
						data-test-id="resend-completed-message"
					>
						Päätökset lähetetty uudelleen
					</div>
				)}
				{!this.state.completed && (
					<div>
						{this.state.confirm && (
							<button onClick={onResend} disabled={resending}>
								{resending
									? "Lähetetään"
									: "Vahvista päätösten uudelleenlähetys"}
							</button>
						)}
						{!this.state.confirm && (
							<button onClick={onConfirm} data-test-id="resend">
								Lähetä {this.props.sent} päätöstä uudelleen
								<HelpTooltip
									content={
										this.props.helpTexts[
											"hakujen_hallinta__päätös___lähetä_päätökset_uudelleen"
										]
									}
									direction="left"
								/>
							</button>
						)}
					</div>
				)}
				{this.state.resendError && (
					<p id="päätös-resend-error" className="error">
						{this.state.resendError}
					</p>
				)}
			</div>
		);
	}
}

interface DecisionDateAndSendProps {
	avustushaku: VirkailijaAvustushaku;
	environment: EnvironmentApiResponse;
	helpTexts: HelpTexts;
	disabled: boolean;
}

interface Paatos {
	id: number;
	version: number;
	"organization-name": string;
	"project-name": string;
	"sent-emails": any;
	view_count: number;
	user_key: string;
	"sent-time": string;
}

interface PaatosSentRes {
	count: number;
	sent: number;
	mail: any;
	"sent-time": string;
	"example-url": string;
	"example-refuse-url": string;
	"example-modify-url": string;
	paatokset: Paatos[];
}

interface DecisionAndSendState {
	currentAvustushakuId: number;
	preview: boolean;
	sending: boolean;
	count?: number;
	sent?: number;
	mail?: any;
	sentTime?: string;
	exampleUrl?: string;
	exampleRefuseUrl?: string;
	exampleModifyUrl?: string;
	paatokset?: Paatos[];
	lahetykset?: Lahetys[];
	sendError?: string;
	paatosDetail?: number;
	paatosViews?: (PaatosView & { timeFormatted: string })[];
}

interface PaatosView {
	id: number;
	hakemus_id: number;
	view_time: string;
	headers: any;
	remote_addr: string;
}

interface PaatosViewsRes {
	views: PaatosView[];
}

class DecisionDateAndSend extends React.Component<
	DecisionDateAndSendProps,
	DecisionAndSendState
> {
	constructor(props: DecisionDateAndSendProps) {
		super(props);
		this.state = DecisionDateAndSend.initialState(props);
		this.rerenderParentCallback = this.rerenderParentCallback.bind(this);
		this.fetchLahetetytPaatokset = this.fetchLahetetytPaatokset.bind(this);
	}

	rerenderParentCallback() {
		this.fetchEmailState(this.props.avustushaku.id);
		this.fetchLahetetytPaatokset(this.props.avustushaku.id);
	}

	static getDerivedStateFromProps(
		props: DecisionDateAndSendProps,
		state: DecisionAndSendState,
	) {
		if (props.avustushaku.id !== state.currentAvustushakuId) {
			return DecisionDateAndSend.initialState(props);
		} else {
			return null;
		}
	}

	static initialState(props: DecisionDateAndSendProps): DecisionAndSendState {
		return {
			currentAvustushakuId: props.avustushaku.id,
			preview: false,
			count: undefined,
			sending: false,
		};
	}

	componentDidMount() {
		this.fetchEmailState(this.props.avustushaku.id);
		this.fetchLahetetytPaatokset(this.props.avustushaku.id);
	}

	componentDidUpdate(prevProps: DecisionDateAndSendProps) {
		if (prevProps.avustushaku.id !== this.state.currentAvustushakuId) {
			this.fetchEmailState(this.props.avustushaku.id);
		}
	}

	render() {
		return (
			<div className="send-decisions-panel">
				<div className="decision-separator" />
				<DateField
					{...this.props}
					field="date"
					label="Ratkaisupäivä"
					disabled={this.props.disabled}
				/>
				{this.props.avustushaku.status === "resolved" &&
					this.sendEmailSection()}
			</div>
		);
	}

	sendEmailSection() {
		return (
			<div>
				<span className="decision-row">
					Päätösten lähettäminen sähköpostilla
				</span>
				<span>
					Huomaathan, että linkkiä avustuksen hylkäämiseen ei lisätä hylättyyn
					päätökseen.
				</span>
				<div className="decision-separator" />
				{this.sendControls(this.rerenderParentCallback)}
			</div>
		);
	}

	sentOk() {
		return _.isNumber(this.state.count) && this.state.count === this.state.sent;
	}

	mailsToSend() {
		return !this.sentOk() && !this.state.sending;
	}

	mailsToSendLabel() {
		if (this.sentOk()) {
			return "0";
		}
		//If, for some reason not all of the mails have been sent
		if (
			_.isNumber(this.state.sent) &&
			this.state.sent !== 0 &&
			this.state.count! > 0
		) {
			return `${this.state.count! - this.state.sent}/${this.state.count}`;
		}
		return this.state.count + "";
	}

	fetchEmailState(avustushakuId: number) {
		const sendS = Bacon.fromPromise<PaatosSentRes>(
			HttpUtil.get(`/api/paatos/sent/${avustushakuId}`),
		);
		sendS.onValue((res) => {
			this.setState({
				...this.state,
				count: res.count,
				sent: res.sent,
				mail: res.mail,
				sentTime: res["sent-time"],
				exampleUrl: res["example-url"],
				exampleRefuseUrl: res["example-refuse-url"],
				exampleModifyUrl: res["example-modify-url"],
				paatokset: res.paatokset,
			});
		});
	}

	fetchLahetetytPaatokset(avustushakuId: number) {
		const sendS = Bacon.fromPromise<Lahetys[]>(
			HttpUtil.get(
				`/api/avustushaku/${avustushakuId}/tapahtumaloki/paatoksen_lahetys`,
			),
		);
		sendS.onValue((lahetykset) => {
			this.setState({ lahetykset });
		});
	}

	hasLahetetytPaatokset() {
		return (
			typeof this.state.lahetykset !== "undefined" &&
			Array.isArray(this.state.lahetykset) &&
			this.state.lahetykset.length > 0
		);
	}

	showTapahtumaLokiOrViimeisinLahetys() {
		return this.hasLahetetytPaatokset() ? (
			<Tapahtumaloki lahetykset={this.state.lahetykset!} />
		) : (
			<strong>
				{this.state.sent} päätöstä lähetetty {this.sentTimeStamp()}
			</strong>
		);
	}

	sendControls(rerenderParentCallback: () => void) {
		const onPreview = () => {
			this.setState({ ...this.state, preview: true });
			setTimeout(() => {
				this.setState({ ...this.state, preview: false });
			}, 5000);
		};

		const onSend = () => {
			this.setState({
				...this.state,
				sending: true,
				preview: false,
				sendError: undefined,
			});
			const sendS = Bacon.fromPromise(
				HttpUtil.post(`/api/paatos/sendall/${this.props.avustushaku.id}`, {}),
			);
			sendS.onValue((res) => {
				this.setState({
					...this.state,
					count: res.count,
					sent: res.sent,
					sentTime: res["sent-time"],
					paatokset: res.paatokset,
					sending: false,
				});
				this.fetchLahetetytPaatokset(this.props.avustushaku.id);
			});
			sendS.onError((err) => {
				const setPäätösSendError = (errorText: string) =>
					this.setState({ sending: false, sendError: errorText });
				if (err.name === "HttpResponseError" && err.response.status === 400) {
					setPäätösSendError(err.response.data.error);
				} else {
					setPäätösSendError(
						"Odottamaton virhe tapahtui lähettäessä päätöksiä",
					);
				}
			});
		};

		if (!_.isNumber(this.state.count)) {
			return <img src="/virkailija/img/ajax-loader.gif" />;
		}

		const onShowViews = (paatos: Paatos) => {
			const sendS = Bacon.fromPromise<PaatosViewsRes>(
				HttpUtil.get(`/api/paatos/views/${paatos.id}`),
			);
			sendS.onValue((res) => {
				const paatosViews = res.views.map((v) => {
					const dateTime = `${DateUtil.asDateString(v.view_time)} ${DateUtil.asTimeString(
						v.view_time,
					)}`;
					return { ...v, timeFormatted: dateTime };
				});
				this.setState({ paatosDetail: paatos.id, paatosViews: paatosViews });
			});
		};

		const onCloseViews = () => this.setState({ paatosDetail: undefined });

		return (
			<div className="decision-send-controls">
				{this.emailPreview()}
				<div className="decision-separator" />
				{this.state.sending && (
					<div>
						<img src="/virkailija/img/ajax-loader.gif" />
						&nbsp;<strong>Päätöksiä lähetetään...</strong>
					</div>
				)}
				{this.mailsToSend() && (
					<span>
						<button
							disabled={this.state.preview || this.sentOk()}
							onClick={onPreview}
						>
							Lähetä {this.mailsToSendLabel()} päätöstä
						</button>
						&nbsp;
					</span>
				)}
				{!this.mailsToSend() && (
					<RegenerateDecisions
						avustushaku={this.props.avustushaku}
						helpTexts={this.props.helpTexts}
					/>
				)}
				{this.state.sent !== 0 && (
					<ResendDecisions
						avustushaku={this.props.avustushaku}
						sent={this.state.sent}
						reload={rerenderParentCallback}
						helpTexts={this.props.helpTexts}
					/>
				)}
				{this.state.preview && (
					<button onClick={onSend}>Vahvista lähetys</button>
				)}
				{this.state.sendError && (
					<p id="päätös-send-error" className="error">
						{this.state.sendError}
					</p>
				)}

				{this.sentOk() && (
					<div>
						{this.showTapahtumaLokiOrViimeisinLahetys()}
						<table className="table table--sm table--views">
							<colgroup>
								<col />
								<col width="60%" />
								<col width="35%" />
								<col width="5%" />
							</colgroup>
							<thead>
								<tr>
									<th>#</th>
									<th>Hakemus</th>
									<th>Osoitteet</th>
									<th>Näytöt</th>
								</tr>
							</thead>
							<tbody>
								{(this.state.paatokset ?? []).map((paatos, index) => (
									<tr key={index}>
										<td>{paatos.id}</td>
										<td>
											<a
												target="_blank"
												rel="noopener noreferrer"
												href={PaatosUrl.publicLink(
													this.props.avustushaku.id,
													paatos.user_key,
												)}
											>
												{paatos["organization-name"]} - {paatos["project-name"]}
											</a>
										</td>
										<td data-test-id={"sent-emails"}>
											{paatos["sent-emails"].addresses.join(" ")}
										</td>
										<td style={{ position: "relative" }}>
											{paatos.view_count === 0 && (
												<span>{paatos.view_count}</span>
											)}
											{paatos.view_count > 0 && (
												<a onClick={onShowViews.bind(this, paatos)}>
													{paatos.view_count}
												</a>
											)}
											{this.state.paatosDetail === paatos.id && (
												<div className="panel person-panel person-panel--view-details">
													<button className="close" onClick={onCloseViews}>
														x
													</button>
													<table className="table">
														<colgroup>
															<col width="20%" />
															<col width="20%" />
															<col width="60%" />
														</colgroup>
														<tbody>
															{(this.state.paatosViews ?? []).map(
																(view, index) => (
																	<tr key={index}>
																		<td>{view.timeFormatted}</td>
																		<td>{view.remote_addr}</td>
																		<td>{view.headers["user-agent"]}</td>
																	</tr>
																),
															)}
														</tbody>
													</table>
												</div>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		);
	}

	sentTimeStamp() {
		if (this.state.sentTime) {
			const sentTimeStamp = new Date(this.state.sentTime);
			return `${DateUtil.asDateString(sentTimeStamp)} klo ${DateUtil.asTimeString(sentTimeStamp)}`;
		}
		return "";
	}

	emailPreview() {
		const mailContent = this.state.mail.content
			.replace(
				"URL_PLACEHOLDER",
				`<a href=${this.state.exampleUrl}>${this.state.exampleUrl}</a>`,
			)
			.replace(
				"REFUSE_URL_PLACEHOLDER",
				`<a href=${this.state.exampleRefuseUrl}>${this.state.exampleRefuseUrl}</a>`,
			)
			.replace(
				"MODIFY_URL_PLACEHOLDER",
				`<a href=${this.state.exampleModifyUrl}>${this.state.exampleModifyUrl}</a>`,
			);

		return (
			<div className="decision-email-preview">
				<div className="decision-email-row">
					<strong className="decision-email-field-label">
						Vastaanottajat:
					</strong>
					<div className="decision-email-field-value">
						{this.state.count} hakemuksen yhteyshenkilö, organisaation
						virallinen sähköpostiosoite ja nimenkirjoitusoikeudelliset henkilöt
					</div>
				</div>
				<div className="decision-email-row">
					<strong className="decision-email-field-label">Lähettäjä:</strong>
					<div className="decision-email-field-value">
						{this.state.mail.sender}
					</div>
				</div>
				<div className="decision-email-row">
					<strong className="decision-email-field-label">Aihe:</strong>
					<div className="decision-email-field-value">
						{this.state.mail.subject}
					</div>
				</div>
				<div className="decision-email-row">
					<strong className="decision-email-field-label">Viesti:</strong>
					<div
						className="decision-email-field-value decision-email-content"
						dangerouslySetInnerHTML={{ __html: mailContent }}
					></div>
				</div>
			</div>
		);
	}
}

const getUniqueKoulutusasteet = (
	talousarviotilit: VirkailijaAvustushaku["talousarviotilit"],
) => {
	const allKoulutusasteet =
		talousarviotilit?.flatMap((t) => t?.koulutusasteet ?? []) ?? [];
	return [...new Set(allKoulutusasteet)];
};

const DecisionEditorPage = () => {
	const dispatch = useHakujenHallintaDispatch();
	const avustushaku = useCurrentAvustushaku();
	const { decisionLiitteet, environment, helpTexts } =
		useHakujenHallintaSelector(selectLoadedInitialData);
	const koulutusasteet = getUniqueKoulutusasteet(avustushaku.talousarviotilit);
	const loadingAvustushaku = useHakujenHallintaSelector(
		(state) => state.haku.loadStatus.loadingAvustushaku,
	);
	const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		dispatch(
			updateField({ avustushaku, field: e.target, newValue: e.target.value }),
		);
	};
	const fields = [
		{
			id: "sovelletutsaannokset",
			title: "Sovelletut säännökset",
			helpText: helpTexts["hakujen_hallinta__päätös___sovelletut_säännökset"],
			dataTestId: "sovelletutsaannokset",
		},
		{
			id: "kayttooikeudet",
			title: "Tekijänoikeudet",
			helpText: helpTexts["hakujen_hallinta__päätös___tekijänoikeudet"],
			dataTestId: "kayttooikeudet",
		},
		{
			id: "kayttotarkoitus",
			title: "Avustuksen käyttötarkoitus",
			helpText:
				helpTexts["hakujen_hallinta__päätös___avustuksen_käyttötarkoitus"],
			dataTestId: "kayttotarkoitus",
		},
		{
			id: "selvitysvelvollisuus",
			title: "Selvitysvelvollisuus",
			helpText: helpTexts["hakujen_hallinta__päätös___selvitysvelvollisuus"],
			dataTestId: "selvitysvelvollisuus",
		},
		{
			id: "hyvaksyminen",
			title: "Päätöksen hyväksyminen",
			helpText: helpTexts["hakujen_hallinta__päätös___päätöksen_hyväksyminen"],
			dataTestId: "hyvaksyminen",
		},
		{
			id: "johtaja",
			title: "Johtaja",
			helpText: helpTexts["hakujen_hallinta__päätös___johtaja"],
			dataTestId: "johtaja",
		},
		{
			id: "valmistelija",
			title: "Esittelijä",
			helpText: helpTexts["hakujen_hallinta__päätös___esittelijä"],
			dataTestId: "valmistelija",
		},
	];
	const updatedAt = avustushaku.decision?.updatedAt;

	const mainHelp = { __html: helpTexts["hakujen_hallinta__päätös___ohje"] };

	return (
		<div className="decision-editor">
			<div data-test-id="paatos-ohje" dangerouslySetInnerHTML={mainHelp} />
			<LastUpdated updatedAt={updatedAt} id={"paatosUpdatedAt"} />
			<DecisionFields
				key="taustaa"
				title="Taustaa"
				avustushaku={avustushaku}
				id="taustaa"
				onChange={onChange}
				disabled={loadingAvustushaku}
				helpText={helpTexts["hakujen_hallinta__päätös___taustaa"]}
				dataTestId="taustaa"
			/>
			<DecisionFields
				key="myonteinenlisateksti"
				title="Myönteisen päätöksen lisäteksti"
				avustushaku={avustushaku}
				id="myonteinenlisateksti"
				onChange={onChange}
				helpText={
					helpTexts[
						"hakujen_hallinta__päätös___myönteisen_päätöksen_lisäteksti"
					]
				}
				dataTestId="myonteinenlisateksti"
				disabled={loadingAvustushaku}
			/>
			<div className="decision-subfields">
				{koulutusasteet.map((aste) => (
					<DecisionFields
						key={aste}
						title={`Myönteisen päätöksen lisäteksti - ${aste}`}
						avustushaku={avustushaku}
						id={`myonteinenlisateksti-${aste.replace(/[\s.]/g, "_")}`}
						onChange={onChange}
						disabled={loadingAvustushaku}
					/>
				))}
			</div>
			{fields.map((field) => (
				<DecisionFields
					key={field.id}
					title={field.title}
					avustushaku={avustushaku}
					id={field.id}
					onChange={onChange}
					helpText={field.helpText}
					dataTestId={field.dataTestId}
					disabled={loadingAvustushaku}
				/>
			))}
			<DecisionFields
				key="maksu"
				title="Avustuksen maksuaika"
				avustushaku={avustushaku}
				id="maksu"
				onChange={onChange}
				helpText={helpTexts["hakujen_hallinta__päätös___avustuksen_maksuaika"]}
				dataTestId={"maksu"}
				disabled={loadingAvustushaku}
			/>
			<Kayttoaika avustushaku={avustushaku} disabled={loadingAvustushaku} />
			<SelvityksienAikarajat
				avustushaku={avustushaku}
				helpTexts={helpTexts}
				disabled={loadingAvustushaku}
			/>
			{avustushaku.content.multiplemaksuera === true && (
				<DateField
					avustushaku={avustushaku}
					field="maksudate"
					label="Viimeinen maksuerä"
					helpTexts={helpTexts}
					disabled={loadingAvustushaku}
				/>
			)}
			<LiitteetSelection
				avustushaku={avustushaku}
				decisionLiitteet={decisionLiitteet}
				helpTexts={helpTexts}
				disabled={loadingAvustushaku}
			/>
			<PakoteLiite />
			<DecisionDateAndSend
				avustushaku={avustushaku}
				environment={environment}
				helpTexts={helpTexts}
				disabled={loadingAvustushaku}
			/>
		</div>
	);
};

const DecisionEditor = () => {
	const avustushaku = tryToUseCurrentAvustushaku();
	if (!avustushaku) {
		return <ChooseAvustushaku />;
	}
	return <DecisionEditorPage />;
};

export default DecisionEditor;
