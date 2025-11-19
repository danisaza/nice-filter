import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
	CheckIcon,
	ChevronRightIcon,
	DotFilledIcon,
	HamburgerMenuIcon,
} from "@radix-ui/react-icons";
import * as React from "react";
import { Input } from "./input";

type SubItem = {
	text: string;
};

const SUB_ITEMS: SubItem[] = [
	{ text: "More Tools" },
	{ text: "Save Page As…" },
	{ text: "Create Shortcut…" },
	{ text: "Name Window…" },
];

const DropdownMenuDemo = () => {
	const [bookmarksChecked, setBookmarksChecked] = React.useState(true);
	const [urlsChecked, setUrlsChecked] = React.useState(false);
	const [person, setPerson] = React.useState("pedro");
	const firstSubTriggerRef = React.useRef<HTMLDivElement>(null);
	const lastSubTriggerRef = React.useRef<HTMLDivElement>(null);
	const [searchText, setSearchText] = React.useState("");

	const focusSearchInput = () => {
		const searchInput = document.getElementById("search-input");
		if (searchInput) {
			console.log("focusing search input");
			searchInput.focus();
		}
	};

	const subItemsToRender: SubItem[] = SUB_ITEMS.filter((subItem) =>
		subItem.text.toLowerCase().includes(searchText.toLowerCase()),
	);

	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild>
				<button
					type="button"
					className="inline-flex size-[35px] items-center justify-center rounded-full bg-white text-violet11 shadow-[0_2px_10px] shadow-blackA4 outline-none hover:bg-violet3 focus:shadow-[0_0_0_2px] focus:shadow-black"
					aria-label="Customise options"
				>
					<HamburgerMenuIcon />
				</button>
			</DropdownMenu.Trigger>

			<DropdownMenu.Portal>
				<DropdownMenu.Content
					className="min-w-[220px] rounded-md bg-white p-[5px] shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade data-[side=right]:animate-slideLeftAndFade data-[side=top]:animate-slideDownAndFade"
					sideOffset={5}
				>
					<Input
						id="search-input"
						onKeyDown={(keyDownEvent) => {
							if (keyDownEvent.key === "ArrowDown") {
								keyDownEvent.preventDefault();
								firstSubTriggerRef.current?.focus();
							} else if (keyDownEvent.key === "ArrowUp") {
								keyDownEvent.preventDefault();
								lastSubTriggerRef.current?.focus();
							}
							keyDownEvent.stopPropagation();
						}}
						onChange={(e) => setSearchText(e.target.value)}
						value={searchText}
						placeholder="Search..."
					/>
					{subItemsToRender.map((subItem, index) => (
						<ExampleSub
							key={subItem.text}
							triggerText={subItem.text}
							onKeyDown={
								index === 0
									? (e) => {
											if (e.key === "ArrowUp") {
												focusSearchInput();
											}
										}
									: undefined
							}
							ref={
								index === 0
									? firstSubTriggerRef
									: index === SUB_ITEMS.length - 1
										? lastSubTriggerRef
										: undefined
							}
						/>
					))}
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	);
};

export default DropdownMenuDemo;

type ExampleSubProps = {
	triggerText: string;
	onKeyDown?: React.KeyboardEventHandler<HTMLDivElement> | undefined;
};

const ExampleSub = React.forwardRef<HTMLDivElement, ExampleSubProps>(
	function ExampleSub(props: ExampleSubProps, forwardedRef) {
		return (
			<DropdownMenu.Sub {...props}>
				<DropdownMenu.SubTrigger
					ref={forwardedRef}
					onKeyDown={props.onKeyDown}
					className="group relative flex h-[25px] select-none items-center rounded-[3px] pl-[25px] pr-[5px] text-[13px] leading-none text-violet11 outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-violet9 data-[highlighted]:data-[state=open]:bg-violet9 data-[state=open]:bg-violet4 data-[disabled]:text-mauve8 data-[highlighted]:data-[state=open]:text-violet1 data-[highlighted]:text-violet1 data-[state=open]:text-violet11"
				>
					{props.triggerText}
					<div className="ml-auto pl-5 text-mauve11 group-data-[disabled]:text-mauve8 group-data-[highlighted]:text-white">
						<ChevronRightIcon />
					</div>
				</DropdownMenu.SubTrigger>
				<DropdownMenu.Portal>
					<DropdownMenu.SubContent
						className="min-w-[220px] rounded-md bg-white p-[5px] shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade data-[side=right]:animate-slideLeftAndFade data-[side=top]:animate-slideDownAndFade"
						sideOffset={2}
						alignOffset={-5}
					>
						<DropdownMenu.Item className="group relative flex h-[25px] select-none items-center rounded-[3px] pl-[25px] pr-[5px] text-[13px] leading-none text-violet11 outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-violet9 data-[disabled]:text-mauve8 data-[highlighted]:text-violet1">
							Save Page As…{" "}
							<div className="ml-auto pl-5 text-mauve11 group-data-[disabled]:text-mauve8 group-data-[highlighted]:text-white">
								⌘+S
							</div>
						</DropdownMenu.Item>
						<DropdownMenu.Item className="relative flex h-[25px] select-none items-center rounded-[3px] pl-[25px] pr-[5px] text-[13px] leading-none text-violet11 outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-violet9 data-[disabled]:text-mauve8 data-[highlighted]:text-violet1">
							Create Shortcut…
						</DropdownMenu.Item>
						<DropdownMenu.Item className="relative flex h-[25px] select-none items-center rounded-[3px] pl-[25px] pr-[5px] text-[13px] leading-none text-violet11 outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-violet9 data-[disabled]:text-mauve8 data-[highlighted]:text-violet1">
							Name Window…
						</DropdownMenu.Item>
						<DropdownMenu.Separator className="m-[5px] h-px bg-violet6" />
						<DropdownMenu.Item className="relative flex h-[25px] select-none items-center rounded-[3px] pl-[25px] pr-[5px] text-[13px] leading-none text-violet11 outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-violet9 data-[disabled]:text-mauve8 data-[highlighted]:text-violet1">
							Developer Tools
						</DropdownMenu.Item>
					</DropdownMenu.SubContent>
				</DropdownMenu.Portal>
			</DropdownMenu.Sub>
		);
	},
);
