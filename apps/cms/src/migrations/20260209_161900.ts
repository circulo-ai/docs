import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_roles" AS ENUM('writer', 'editor', 'admin');
  CREATE TYPE "public"."enum_services_icon_source" AS ENUM('lucide', 'custom');
  CREATE TYPE "public"."enum_services_icon_lucide" AS ENUM('AArrowDown', 'AArrowUp', 'Accessibility', 'Activity', 'Airplay', 'AirVent', 'ALargeSmall', 'AlarmClock', 'AlarmClockCheck', 'AlarmClockMinus', 'AlarmClockOff', 'AlarmClockPlus', 'AlarmSmoke', 'Album', 'AlignCenterHorizontal', 'AlignCenterVertical', 'AlignEndHorizontal', 'AlignEndVertical', 'AlignHorizontalDistributeCenter', 'AlignHorizontalDistributeEnd', 'AlignHorizontalDistributeStart', 'AlignHorizontalJustifyCenter', 'AlignHorizontalJustifyEnd', 'AlignHorizontalJustifyStart', 'AlignHorizontalSpaceAround', 'AlignHorizontalSpaceBetween', 'AlignStartHorizontal', 'AlignStartVertical', 'AlignVerticalDistributeCenter', 'AlignVerticalDistributeEnd', 'AlignVerticalDistributeStart', 'AlignVerticalJustifyCenter', 'AlignVerticalJustifyEnd', 'AlignVerticalJustifyStart', 'AlignVerticalSpaceAround', 'AlignVerticalSpaceBetween', 'Ambulance', 'Ampersand', 'Ampersands', 'Amphora', 'Anchor', 'Angry', 'Annoyed', 'Antenna', 'Anvil', 'Aperture', 'Apple', 'AppWindow', 'AppWindowMac', 'Archive', 'ArchiveRestore', 'ArchiveX', 'Armchair', 'ArrowBigDown', 'ArrowBigDownDash', 'ArrowBigLeft', 'ArrowBigLeftDash', 'ArrowBigRight', 'ArrowBigRightDash', 'ArrowBigUp', 'ArrowBigUpDash', 'ArrowDown', 'ArrowDown01', 'ArrowDown10', 'ArrowDownAZ', 'ArrowDownFromLine', 'ArrowDownLeft', 'ArrowDownNarrowWide', 'ArrowDownRight', 'ArrowDownToDot', 'ArrowDownToLine', 'ArrowDownUp', 'ArrowDownWideNarrow', 'ArrowDownZA', 'ArrowLeft', 'ArrowLeftFromLine', 'ArrowLeftRight', 'ArrowLeftToLine', 'ArrowRight', 'ArrowRightFromLine', 'ArrowRightLeft', 'ArrowRightToLine', 'ArrowsUpFromLine', 'ArrowUp', 'ArrowUp01', 'ArrowUp10', 'ArrowUpAZ', 'ArrowUpDown', 'ArrowUpFromDot', 'ArrowUpFromLine', 'ArrowUpLeft', 'ArrowUpNarrowWide', 'ArrowUpRight', 'ArrowUpToLine', 'ArrowUpWideNarrow', 'ArrowUpZA', 'Asterisk', 'Atom', 'AtSign', 'AudioLines', 'AudioWaveform', 'Award', 'Axe', 'Axis3d', 'Baby', 'Backpack', 'Badge', 'BadgeAlert', 'BadgeCent', 'BadgeCheck', 'BadgeDollarSign', 'BadgeEuro', 'BadgeIndianRupee', 'BadgeInfo', 'BadgeJapaneseYen', 'BadgeMinus', 'BadgePercent', 'BadgePlus', 'BadgePoundSterling', 'BadgeQuestionMark', 'BadgeRussianRuble', 'BadgeSwissFranc', 'BadgeTurkishLira', 'BadgeX', 'BaggageClaim', 'Balloon', 'Ban', 'Banana', 'Bandage', 'Banknote', 'BanknoteArrowDown', 'BanknoteArrowUp', 'BanknoteX', 'Barcode', 'Barrel', 'Baseline', 'Bath', 'Battery', 'BatteryCharging', 'BatteryFull', 'BatteryLow', 'BatteryMedium', 'BatteryPlus', 'BatteryWarning', 'Beaker', 'Bean', 'BeanOff', 'Bed', 'BedDouble', 'BedSingle', 'Beef', 'Beer', 'BeerOff', 'Bell', 'BellDot', 'BellElectric', 'BellMinus', 'BellOff', 'BellPlus', 'BellRing', 'BetweenHorizontalEnd', 'BetweenHorizontalStart', 'BetweenVerticalEnd', 'BetweenVerticalStart', 'BicepsFlexed', 'Bike', 'Binary', 'Binoculars', 'Biohazard', 'Bird', 'Birdhouse', 'Bitcoin', 'Blend', 'Blinds', 'Blocks', 'Bluetooth', 'BluetoothConnected', 'BluetoothOff', 'BluetoothSearching', 'Bold', 'Bolt', 'Bomb', 'Bone', 'Book', 'BookA', 'BookAlert', 'BookAudio', 'BookCheck', 'BookCopy', 'BookDashed', 'BookDown', 'BookHeadphones', 'BookHeart', 'BookImage', 'BookKey', 'BookLock', 'Bookmark', 'BookmarkCheck', 'BookMarked', 'BookmarkMinus', 'BookmarkPlus', 'BookmarkX', 'BookMinus', 'BookOpen', 'BookOpenCheck', 'BookOpenText', 'BookPlus', 'BookSearch', 'BookText', 'BookType', 'BookUp', 'BookUp2', 'BookUser', 'BookX', 'BoomBox', 'Bot', 'BotMessageSquare', 'BotOff', 'BottleWine', 'BowArrow', 'Box', 'Boxes', 'Braces', 'Brackets', 'Brain', 'BrainCircuit', 'BrainCog', 'BrickWall', 'BrickWallFire', 'BrickWallShield', 'Briefcase', 'BriefcaseBusiness', 'BriefcaseConveyorBelt', 'BriefcaseMedical', 'BringToFront', 'Brush', 'BrushCleaning', 'Bubbles', 'Bug', 'BugOff', 'BugPlay', 'Building', 'Building2', 'Bus', 'BusFront', 'Cable', 'CableCar', 'Cake', 'CakeSlice', 'Calculator', 'Calendar', 'Calendar1', 'CalendarArrowDown', 'CalendarArrowUp', 'CalendarCheck', 'CalendarCheck2', 'CalendarClock', 'CalendarCog', 'CalendarDays', 'CalendarFold', 'CalendarHeart', 'CalendarMinus', 'CalendarMinus2', 'CalendarOff', 'CalendarPlus', 'CalendarPlus2', 'CalendarRange', 'Calendars', 'CalendarSearch', 'CalendarSync', 'CalendarX', 'CalendarX2', 'Camera', 'CameraOff', 'Candy', 'CandyCane', 'CandyOff', 'Cannabis', 'CannabisOff', 'Captions', 'CaptionsOff', 'Car', 'Caravan', 'CardSim', 'CarFront', 'Carrot', 'CarTaxiFront', 'CaseLower', 'CaseSensitive', 'CaseUpper', 'CassetteTape', 'Cast', 'Castle', 'Cat', 'Cctv', 'ChartArea', 'ChartBar', 'ChartBarBig', 'ChartBarDecreasing', 'ChartBarIncreasing', 'ChartBarStacked', 'ChartCandlestick', 'ChartColumn', 'ChartColumnBig', 'ChartColumnDecreasing', 'ChartColumnIncreasing', 'ChartColumnStacked', 'ChartGantt', 'ChartLine', 'ChartNetwork', 'ChartNoAxesColumn', 'ChartNoAxesColumnDecreasing', 'ChartNoAxesColumnIncreasing', 'ChartNoAxesCombined', 'ChartNoAxesGantt', 'ChartPie', 'ChartScatter', 'ChartSpline', 'Check', 'CheckCheck', 'CheckLine', 'ChefHat', 'Cherry', 'ChessBishop', 'ChessKing', 'ChessKnight', 'ChessPawn', 'ChessQueen', 'ChessRook', 'ChevronDown', 'ChevronFirst', 'ChevronLast', 'ChevronLeft', 'ChevronRight', 'ChevronsDown', 'ChevronsDownUp', 'ChevronsLeft', 'ChevronsLeftRight', 'ChevronsLeftRightEllipsis', 'ChevronsRight', 'ChevronsRightLeft', 'ChevronsUp', 'ChevronsUpDown', 'ChevronUp', 'Chromium', 'Church', 'Cigarette', 'CigaretteOff', 'Circle', 'CircleAlert', 'CircleArrowDown', 'CircleArrowLeft', 'CircleArrowOutDownLeft', 'CircleArrowOutDownRight', 'CircleArrowOutUpLeft', 'CircleArrowOutUpRight', 'CircleArrowRight', 'CircleArrowUp', 'CircleCheck', 'CircleCheckBig', 'CircleChevronDown', 'CircleChevronLeft', 'CircleChevronRight', 'CircleChevronUp', 'CircleDashed', 'CircleDivide', 'CircleDollarSign', 'CircleDot', 'CircleDotDashed', 'CircleEllipsis', 'CircleEqual', 'CircleFadingArrowUp', 'CircleFadingPlus', 'CircleGauge', 'CircleMinus', 'CircleOff', 'CircleParking', 'CircleParkingOff', 'CirclePause', 'CirclePercent', 'CirclePile', 'CirclePlay', 'CirclePlus', 'CirclePoundSterling', 'CirclePower', 'CircleQuestionMark', 'CircleSlash', 'CircleSlash2', 'CircleSmall', 'CircleStar', 'CircleStop', 'CircleUser', 'CircleUserRound', 'CircleX', 'CircuitBoard', 'Citrus', 'Clapperboard', 'Clipboard', 'ClipboardCheck', 'ClipboardClock', 'ClipboardCopy', 'ClipboardList', 'ClipboardMinus', 'ClipboardPaste', 'ClipboardPen', 'ClipboardPenLine', 'ClipboardPlus', 'ClipboardType', 'ClipboardX', 'Clock', 'Clock1', 'Clock10', 'Clock11', 'Clock12', 'Clock2', 'Clock3', 'Clock4', 'Clock5', 'Clock6', 'Clock7', 'Clock8', 'Clock9', 'ClockAlert', 'ClockArrowDown', 'ClockArrowUp', 'ClockCheck', 'ClockFading', 'ClockPlus', 'ClosedCaption', 'Cloud', 'CloudAlert', 'CloudBackup', 'CloudCheck', 'CloudCog', 'CloudDownload', 'CloudDrizzle', 'CloudFog', 'CloudHail', 'CloudLightning', 'CloudMoon', 'CloudMoonRain', 'CloudOff', 'CloudRain', 'CloudRainWind', 'CloudSnow', 'CloudSun', 'CloudSunRain', 'CloudSync', 'CloudUpload', 'Cloudy', 'Clover', 'Club', 'Code', 'Codepen', 'Codesandbox', 'CodeXml', 'Coffee', 'Cog', 'Coins', 'Columns2', 'Columns3', 'Columns3Cog', 'Columns4', 'Combine', 'Command', 'Compass', 'Component', 'Computer', 'ConciergeBell', 'Cone', 'Construction', 'Contact', 'ContactRound', 'Container', 'Contrast', 'Cookie', 'CookingPot', 'Copy', 'CopyCheck', 'Copyleft', 'CopyMinus', 'CopyPlus', 'Copyright', 'CopySlash', 'CopyX', 'CornerDownLeft', 'CornerDownRight', 'CornerLeftDown', 'CornerLeftUp', 'CornerRightDown', 'CornerRightUp', 'CornerUpLeft', 'CornerUpRight', 'Cpu', 'CreativeCommons', 'CreditCard', 'Croissant', 'Crop', 'Cross', 'Crosshair', 'Crown', 'Cuboid', 'CupSoda', 'Currency', 'Cylinder', 'Dam', 'Database', 'DatabaseBackup', 'DatabaseZap', 'DecimalsArrowLeft', 'DecimalsArrowRight', 'Delete', 'Dessert', 'Diameter', 'Diamond', 'DiamondMinus', 'DiamondPercent', 'DiamondPlus', 'Dice1', 'Dice2', 'Dice3', 'Dice4', 'Dice5', 'Dice6', 'Dices', 'Diff', 'Disc', 'Disc2', 'Disc3', 'DiscAlbum', 'Divide', 'Dna', 'DnaOff', 'Dock', 'Dog', 'DollarSign', 'Donut', 'DoorClosed', 'DoorClosedLocked', 'DoorOpen', 'Dot', 'Download', 'DraftingCompass', 'Drama', 'Dribbble', 'Drill', 'Drone', 'Droplet', 'DropletOff', 'Droplets', 'Drum', 'Drumstick', 'Dumbbell', 'Ear', 'EarOff', 'Earth', 'EarthLock', 'Eclipse', 'Egg', 'EggFried', 'EggOff', 'Ellipsis', 'EllipsisVertical', 'Equal', 'EqualApproximately', 'EqualNot', 'Eraser', 'EthernetPort', 'Euro', 'EvCharger', 'Expand', 'ExternalLink', 'Eye', 'EyeClosed', 'EyeOff', 'Facebook', 'Factory', 'Fan', 'FastForward', 'Feather', 'Fence', 'FerrisWheel', 'Figma', 'File', 'FileArchive', 'FileAxis3d', 'FileBadge', 'FileBox', 'FileBraces', 'FileBracesCorner', 'FileChartColumn', 'FileChartColumnIncreasing', 'FileChartLine', 'FileChartPie', 'FileCheck', 'FileCheckCorner', 'FileClock', 'FileCode', 'FileCodeCorner', 'FileCog', 'FileDiff', 'FileDigit', 'FileDown', 'FileExclamationPoint', 'FileHeadphone', 'FileHeart', 'FileImage', 'FileInput', 'FileKey', 'FileLock', 'FileMinus', 'FileMinusCorner', 'FileMusic', 'FileOutput', 'FilePen', 'FilePenLine', 'FilePlay', 'FilePlus', 'FilePlusCorner', 'FileQuestionMark', 'Files', 'FileScan', 'FileSearch', 'FileSearchCorner', 'FileSignal', 'FileSliders', 'FileSpreadsheet', 'FileStack', 'FileSymlink', 'FileTerminal', 'FileText', 'FileType', 'FileTypeCorner', 'FileUp', 'FileUser', 'FileVideoCamera', 'FileVolume', 'FileX', 'FileXCorner', 'Film', 'FingerprintPattern', 'FireExtinguisher', 'Fish', 'FishingHook', 'FishOff', 'FishSymbol', 'Flag', 'FlagOff', 'FlagTriangleLeft', 'FlagTriangleRight', 'Flame', 'FlameKindling', 'Flashlight', 'FlashlightOff', 'FlaskConical', 'FlaskConicalOff', 'FlaskRound', 'FlipHorizontal', 'FlipHorizontal2', 'FlipVertical', 'FlipVertical2', 'Flower', 'Flower2', 'Focus', 'Folder', 'FolderArchive', 'FolderCheck', 'FolderClock', 'FolderClosed', 'FolderCode', 'FolderCog', 'FolderDot', 'FolderDown', 'FolderGit', 'FolderGit2', 'FolderHeart', 'FolderInput', 'FolderKanban', 'FolderKey', 'FolderLock', 'FolderMinus', 'FolderOpen', 'FolderOpenDot', 'FolderOutput', 'FolderPen', 'FolderPlus', 'FolderRoot', 'Folders', 'FolderSearch', 'FolderSearch2', 'FolderSymlink', 'FolderSync', 'FolderTree', 'FolderUp', 'FolderX', 'FoldHorizontal', 'FoldVertical', 'Footprints', 'Forklift', 'Form', 'Forward', 'Frame', 'Framer', 'Frown', 'Fuel', 'Fullscreen', 'Funnel', 'FunnelPlus', 'FunnelX', 'GalleryHorizontal', 'GalleryHorizontalEnd', 'GalleryThumbnails', 'GalleryVertical', 'GalleryVerticalEnd', 'Gamepad', 'Gamepad2', 'GamepadDirectional', 'Gauge', 'Gavel', 'Gem', 'GeorgianLari', 'Ghost', 'Gift', 'GitBranch', 'GitBranchMinus', 'GitBranchPlus', 'GitCommitHorizontal', 'GitCommitVertical', 'GitCompare', 'GitCompareArrows', 'GitFork', 'GitGraph', 'Github', 'Gitlab', 'GitMerge', 'GitPullRequest', 'GitPullRequestArrow', 'GitPullRequestClosed', 'GitPullRequestCreate', 'GitPullRequestCreateArrow', 'GitPullRequestDraft', 'Glasses', 'GlassWater', 'Globe', 'GlobeLock', 'GlobeX', 'Goal', 'Gpu', 'GraduationCap', 'Grape', 'Grid2x2', 'Grid2x2Check', 'Grid2x2Plus', 'Grid2x2X', 'Grid3x2', 'Grid3x3', 'Grip', 'GripHorizontal', 'GripVertical', 'Group', 'Guitar', 'Ham', 'Hamburger', 'Hammer', 'Hand', 'Handbag', 'HandCoins', 'HandFist', 'HandGrab', 'HandHeart', 'HandHelping', 'HandMetal', 'HandPlatter', 'Handshake', 'HardDrive', 'HardDriveDownload', 'HardDriveUpload', 'HardHat', 'Hash', 'HatGlasses', 'Haze', 'Hd', 'HdmiPort', 'Heading', 'Heading1', 'Heading2', 'Heading3', 'Heading4', 'Heading5', 'Heading6', 'HeadphoneOff', 'Headphones', 'Headset', 'Heart', 'HeartCrack', 'HeartHandshake', 'HeartMinus', 'HeartOff', 'HeartPlus', 'HeartPulse', 'Heater', 'Helicopter', 'Hexagon', 'Highlighter', 'History', 'Hop', 'HopOff', 'Hospital', 'Hotel', 'Hourglass', 'House', 'HouseHeart', 'HousePlug', 'HousePlus', 'HouseWifi', 'IceCreamBowl', 'IceCreamCone', 'IdCard', 'IdCardLanyard', 'Image', 'ImageDown', 'ImageMinus', 'ImageOff', 'ImagePlay', 'ImagePlus', 'Images', 'ImageUp', 'ImageUpscale', 'Import', 'Inbox', 'IndianRupee', 'Infinity', 'Info', 'InspectionPanel', 'Instagram', 'Italic', 'IterationCcw', 'IterationCw', 'JapaneseYen', 'Joystick', 'Kanban', 'Kayak', 'Key', 'Keyboard', 'KeyboardMusic', 'KeyboardOff', 'KeyRound', 'KeySquare', 'Lamp', 'LampCeiling', 'LampDesk', 'LampFloor', 'LampWallDown', 'LampWallUp', 'Landmark', 'LandPlot', 'Languages', 'Laptop', 'LaptopMinimal', 'LaptopMinimalCheck', 'Lasso', 'LassoSelect', 'Laugh', 'Layers', 'Layers2', 'LayersPlus', 'LayoutDashboard', 'LayoutGrid', 'LayoutList', 'LayoutPanelLeft', 'LayoutPanelTop', 'LayoutTemplate', 'Leaf', 'LeafyGreen', 'Lectern', 'Library', 'LibraryBig', 'LifeBuoy', 'Ligature', 'Lightbulb', 'LightbulbOff', 'LineSquiggle', 'Link', 'Link2', 'Link2Off', 'Linkedin', 'List', 'ListCheck', 'ListChecks', 'ListChevronsDownUp', 'ListChevronsUpDown', 'ListCollapse', 'ListEnd', 'ListFilter', 'ListFilterPlus', 'ListIndentDecrease', 'ListIndentIncrease', 'ListMinus', 'ListMusic', 'ListOrdered', 'ListPlus', 'ListRestart', 'ListStart', 'ListTodo', 'ListTree', 'ListVideo', 'ListX', 'Loader', 'LoaderCircle', 'LoaderPinwheel', 'Locate', 'LocateFixed', 'LocateOff', 'Lock', 'LockKeyhole', 'LockKeyholeOpen', 'LockOpen', 'LogIn', 'LogOut', 'Logs', 'Lollipop', 'Luggage', 'Magnet', 'Mail', 'Mailbox', 'MailCheck', 'MailMinus', 'MailOpen', 'MailPlus', 'MailQuestionMark', 'Mails', 'MailSearch', 'MailWarning', 'MailX', 'Map', 'MapMinus', 'MapPin', 'MapPinCheck', 'MapPinCheckInside', 'MapPinHouse', 'MapPinMinus', 'MapPinMinusInside', 'MapPinned', 'MapPinOff', 'MapPinPen', 'MapPinPlus', 'MapPinPlusInside', 'MapPinX', 'MapPinXInside', 'MapPlus', 'Mars', 'MarsStroke', 'Martini', 'Maximize', 'Maximize2', 'Medal', 'Megaphone', 'MegaphoneOff', 'Meh', 'MemoryStick', 'Menu', 'Merge', 'MessageCircle', 'MessageCircleCode', 'MessageCircleDashed', 'MessageCircleHeart', 'MessageCircleMore', 'MessageCircleOff', 'MessageCirclePlus', 'MessageCircleQuestionMark', 'MessageCircleReply', 'MessageCircleWarning', 'MessageCircleX', 'MessageSquare', 'MessageSquareCode', 'MessageSquareDashed', 'MessageSquareDiff', 'MessageSquareDot', 'MessageSquareHeart', 'MessageSquareLock', 'MessageSquareMore', 'MessageSquareOff', 'MessageSquarePlus', 'MessageSquareQuote', 'MessageSquareReply', 'MessageSquareShare', 'MessageSquareText', 'MessageSquareWarning', 'MessageSquareX', 'MessagesSquare', 'Mic', 'MicOff', 'Microchip', 'Microscope', 'Microwave', 'MicVocal', 'Milestone', 'Milk', 'MilkOff', 'Minimize', 'Minimize2', 'Minus', 'Monitor', 'MonitorCheck', 'MonitorCloud', 'MonitorCog', 'MonitorDot', 'MonitorDown', 'MonitorOff', 'MonitorPause', 'MonitorPlay', 'MonitorSmartphone', 'MonitorSpeaker', 'MonitorStop', 'MonitorUp', 'MonitorX', 'Moon', 'MoonStar', 'Motorbike', 'Mountain', 'MountainSnow', 'Mouse', 'MouseOff', 'MousePointer', 'MousePointer2', 'MousePointer2Off', 'MousePointerBan', 'MousePointerClick', 'Move', 'Move3d', 'MoveDiagonal', 'MoveDiagonal2', 'MoveDown', 'MoveDownLeft', 'MoveDownRight', 'MoveHorizontal', 'MoveLeft', 'MoveRight', 'MoveUp', 'MoveUpLeft', 'MoveUpRight', 'MoveVertical', 'Music', 'Music2', 'Music3', 'Music4', 'Navigation', 'Navigation2', 'Navigation2Off', 'NavigationOff', 'Network', 'Newspaper', 'Nfc', 'NonBinary', 'Notebook', 'NotebookPen', 'NotebookTabs', 'NotebookText', 'NotepadText', 'NotepadTextDashed', 'Nut', 'NutOff', 'Octagon', 'OctagonAlert', 'OctagonMinus', 'OctagonPause', 'OctagonX', 'Omega', 'Option', 'Orbit', 'Origami', 'Package', 'Package2', 'PackageCheck', 'PackageMinus', 'PackageOpen', 'PackagePlus', 'PackageSearch', 'PackageX', 'Paintbrush', 'PaintbrushVertical', 'PaintBucket', 'PaintRoller', 'Palette', 'Panda', 'PanelBottom', 'PanelBottomClose', 'PanelBottomDashed', 'PanelBottomOpen', 'PanelLeft', 'PanelLeftClose', 'PanelLeftDashed', 'PanelLeftOpen', 'PanelLeftRightDashed', 'PanelRight', 'PanelRightClose', 'PanelRightDashed', 'PanelRightOpen', 'PanelsLeftBottom', 'PanelsRightBottom', 'PanelsTopLeft', 'PanelTop', 'PanelTopBottomDashed', 'PanelTopClose', 'PanelTopDashed', 'PanelTopOpen', 'Paperclip', 'Parentheses', 'ParkingMeter', 'PartyPopper', 'Pause', 'PawPrint', 'PcCase', 'Pen', 'Pencil', 'PencilLine', 'PencilOff', 'PencilRuler', 'PenLine', 'PenOff', 'Pentagon', 'PenTool', 'Percent', 'PersonStanding', 'PhilippinePeso', 'Phone', 'PhoneCall', 'PhoneForwarded', 'PhoneIncoming', 'PhoneMissed', 'PhoneOff', 'PhoneOutgoing', 'Pi', 'Piano', 'Pickaxe', 'PictureInPicture', 'PictureInPicture2', 'PiggyBank', 'Pilcrow', 'PilcrowLeft', 'PilcrowRight', 'Pill', 'PillBottle', 'Pin', 'PinOff', 'Pipette', 'Pizza', 'Plane', 'PlaneLanding', 'PlaneTakeoff', 'Play', 'Plug', 'Plug2', 'PlugZap', 'Plus', 'Pocket', 'PocketKnife', 'Podcast', 'Pointer', 'PointerOff', 'Popcorn', 'Popsicle', 'PoundSterling', 'Power', 'PowerOff', 'Presentation', 'Printer', 'PrinterCheck', 'PrinterX', 'Projector', 'Proportions', 'Puzzle', 'Pyramid', 'QrCode', 'Quote', 'Rabbit', 'Radar', 'Radiation', 'Radical', 'Radio', 'RadioReceiver', 'RadioTower', 'Radius', 'RailSymbol', 'Rainbow', 'Rat', 'Ratio', 'Receipt', 'ReceiptCent', 'ReceiptEuro', 'ReceiptIndianRupee', 'ReceiptJapaneseYen', 'ReceiptPoundSterling', 'ReceiptRussianRuble', 'ReceiptSwissFranc', 'ReceiptText', 'ReceiptTurkishLira', 'RectangleCircle', 'RectangleEllipsis', 'RectangleGoggles', 'RectangleHorizontal', 'RectangleVertical', 'Recycle', 'Redo', 'Redo2', 'RedoDot', 'RefreshCcw', 'RefreshCcwDot', 'RefreshCw', 'RefreshCwOff', 'Refrigerator', 'Regex', 'RemoveFormatting', 'Repeat', 'Repeat1', 'Repeat2', 'Replace', 'ReplaceAll', 'Reply', 'ReplyAll', 'Rewind', 'Ribbon', 'Rocket', 'RockingChair', 'RollerCoaster', 'Rose', 'Rotate3d', 'RotateCcw', 'RotateCcwKey', 'RotateCcwSquare', 'RotateCw', 'RotateCwSquare', 'Route', 'RouteOff', 'Router', 'Rows2', 'Rows3', 'Rows4', 'Rss', 'Ruler', 'RulerDimensionLine', 'RussianRuble', 'Sailboat', 'Salad', 'Sandwich', 'Satellite', 'SatelliteDish', 'SaudiRiyal', 'Save', 'SaveAll', 'SaveOff', 'Scale', 'Scale3d', 'Scaling', 'Scan', 'ScanBarcode', 'ScanEye', 'ScanFace', 'ScanHeart', 'ScanLine', 'ScanQrCode', 'ScanSearch', 'ScanText', 'School', 'Scissors', 'ScissorsLineDashed', 'Scooter', 'ScreenShare', 'ScreenShareOff', 'Scroll', 'ScrollText', 'Search', 'SearchAlert', 'SearchCheck', 'SearchCode', 'SearchSlash', 'SearchX', 'Section', 'Send', 'SendHorizontal', 'SendToBack', 'SeparatorHorizontal', 'SeparatorVertical', 'Server', 'ServerCog', 'ServerCrash', 'ServerOff', 'Settings', 'Settings2', 'Shapes', 'Share', 'Share2', 'Sheet', 'Shell', 'Shield', 'ShieldAlert', 'ShieldBan', 'ShieldCheck', 'ShieldEllipsis', 'ShieldHalf', 'ShieldMinus', 'ShieldOff', 'ShieldPlus', 'ShieldQuestionMark', 'ShieldUser', 'ShieldX', 'Ship', 'ShipWheel', 'Shirt', 'ShoppingBag', 'ShoppingBasket', 'ShoppingCart', 'Shovel', 'ShowerHead', 'Shredder', 'Shrimp', 'Shrink', 'Shrub', 'Shuffle', 'Sigma', 'Signal', 'SignalHigh', 'SignalLow', 'SignalMedium', 'SignalZero', 'Signature', 'Signpost', 'SignpostBig', 'Siren', 'SkipBack', 'SkipForward', 'Skull', 'Slack', 'Slash', 'Slice', 'SlidersHorizontal', 'SlidersVertical', 'Smartphone', 'SmartphoneCharging', 'SmartphoneNfc', 'Smile', 'SmilePlus', 'Snail', 'Snowflake', 'SoapDispenserDroplet', 'Sofa', 'SolarPanel', 'Soup', 'Space', 'Spade', 'Sparkle', 'Sparkles', 'Speaker', 'Speech', 'SpellCheck', 'SpellCheck2', 'Spline', 'SplinePointer', 'Split', 'Spool', 'Spotlight', 'SprayCan', 'Sprout', 'Square', 'SquareActivity', 'SquareArrowDown', 'SquareArrowDownLeft', 'SquareArrowDownRight', 'SquareArrowLeft', 'SquareArrowOutDownLeft', 'SquareArrowOutDownRight', 'SquareArrowOutUpLeft', 'SquareArrowOutUpRight', 'SquareArrowRight', 'SquareArrowUp', 'SquareArrowUpLeft', 'SquareArrowUpRight', 'SquareAsterisk', 'SquareBottomDashedScissors', 'SquareChartGantt', 'SquareCheck', 'SquareCheckBig', 'SquareChevronDown', 'SquareChevronLeft', 'SquareChevronRight', 'SquareChevronUp', 'SquareCode', 'SquareDashed', 'SquareDashedBottom', 'SquareDashedBottomCode', 'SquareDashedKanban', 'SquareDashedMousePointer', 'SquareDashedTopSolid', 'SquareDivide', 'SquareDot', 'SquareEqual', 'SquareFunction', 'SquareKanban', 'SquareLibrary', 'SquareM', 'SquareMenu', 'SquareMinus', 'SquareMousePointer', 'SquareParking', 'SquareParkingOff', 'SquarePause', 'SquarePen', 'SquarePercent', 'SquarePi', 'SquarePilcrow', 'SquarePlay', 'SquarePlus', 'SquarePower', 'SquareRadical', 'SquareRoundCorner', 'SquareScissors', 'SquaresExclude', 'SquareSigma', 'SquaresIntersect', 'SquareSlash', 'SquareSplitHorizontal', 'SquareSplitVertical', 'SquareSquare', 'SquaresSubtract', 'SquareStack', 'SquareStar', 'SquareStop', 'SquaresUnite', 'SquareTerminal', 'SquareUser', 'SquareUserRound', 'SquareX', 'Squircle', 'SquircleDashed', 'Squirrel', 'Stamp', 'Star', 'StarHalf', 'StarOff', 'StepBack', 'StepForward', 'Stethoscope', 'Sticker', 'StickyNote', 'Stone', 'Store', 'StretchHorizontal', 'StretchVertical', 'Strikethrough', 'Subscript', 'Sun', 'SunDim', 'SunMedium', 'SunMoon', 'Sunrise', 'Sunset', 'SunSnow', 'Superscript', 'SwatchBook', 'SwissFranc', 'SwitchCamera', 'Sword', 'Swords', 'Syringe', 'Table', 'Table2', 'TableCellsMerge', 'TableCellsSplit', 'TableColumnsSplit', 'TableOfContents', 'TableProperties', 'TableRowsSplit', 'Tablet', 'Tablets', 'TabletSmartphone', 'Tag', 'Tags', 'Tally1', 'Tally2', 'Tally3', 'Tally4', 'Tally5', 'Tangent', 'Target', 'Telescope', 'Tent', 'TentTree', 'Terminal', 'TestTube', 'TestTubeDiagonal', 'TestTubes', 'TextAlignCenter', 'TextAlignEnd', 'TextAlignJustify', 'TextAlignStart', 'TextCursor', 'TextCursorInput', 'TextInitial', 'TextQuote', 'TextSearch', 'TextSelect', 'TextWrap', 'Theater', 'Thermometer', 'ThermometerSnowflake', 'ThermometerSun', 'ThumbsDown', 'ThumbsUp', 'Ticket', 'TicketCheck', 'TicketMinus', 'TicketPercent', 'TicketPlus', 'Tickets', 'TicketSlash', 'TicketsPlane', 'TicketX', 'Timer', 'TimerOff', 'TimerReset', 'ToggleLeft', 'ToggleRight', 'Toilet', 'Toolbox', 'ToolCase', 'Tornado', 'Torus', 'Touchpad', 'TouchpadOff', 'TowerControl', 'ToyBrick', 'Tractor', 'TrafficCone', 'TrainFront', 'TrainFrontTunnel', 'TrainTrack', 'TramFront', 'Transgender', 'Trash', 'Trash2', 'TreeDeciduous', 'TreePalm', 'TreePine', 'Trees', 'Trello', 'TrendingDown', 'TrendingUp', 'TrendingUpDown', 'Triangle', 'TriangleAlert', 'TriangleDashed', 'TriangleRight', 'Trophy', 'Truck', 'TruckElectric', 'TurkishLira', 'Turntable', 'Turtle', 'Tv', 'TvMinimal', 'TvMinimalPlay', 'Twitch', 'Twitter', 'Type', 'TypeOutline', 'Umbrella', 'UmbrellaOff', 'Underline', 'Undo', 'Undo2', 'UndoDot', 'UnfoldHorizontal', 'UnfoldVertical', 'Ungroup', 'University', 'Unlink', 'Unlink2', 'Unplug', 'Upload', 'Usb', 'User', 'UserCheck', 'UserCog', 'UserLock', 'UserMinus', 'UserPen', 'UserPlus', 'UserRound', 'UserRoundCheck', 'UserRoundCog', 'UserRoundMinus', 'UserRoundPen', 'UserRoundPlus', 'UserRoundSearch', 'UserRoundX', 'Users', 'UserSearch', 'UsersRound', 'UserStar', 'UserX', 'Utensils', 'UtensilsCrossed', 'UtilityPole', 'Van', 'Variable', 'Vault', 'VectorSquare', 'Vegan', 'VenetianMask', 'Venus', 'VenusAndMars', 'Vibrate', 'VibrateOff', 'Video', 'VideoOff', 'Videotape', 'View', 'Voicemail', 'Volleyball', 'Volume', 'Volume1', 'Volume2', 'VolumeOff', 'VolumeX', 'Vote', 'Wallet', 'WalletCards', 'WalletMinimal', 'Wallpaper', 'Wand', 'WandSparkles', 'Warehouse', 'WashingMachine', 'Watch', 'Waves', 'WavesArrowDown', 'WavesArrowUp', 'WavesLadder', 'Waypoints', 'Webcam', 'Webhook', 'WebhookOff', 'Weight', 'WeightTilde', 'Wheat', 'WheatOff', 'WholeWord', 'Wifi', 'WifiCog', 'WifiHigh', 'WifiLow', 'WifiOff', 'WifiPen', 'WifiSync', 'WifiZero', 'Wind', 'WindArrowDown', 'Wine', 'WineOff', 'Workflow', 'Worm', 'Wrench', 'X', 'Youtube', 'Zap', 'ZapOff', 'ZoomIn', 'ZoomOut');
  CREATE TYPE "public"."enum_doc_versions_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_doc_pages_status" AS ENUM('draft', 'published');
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "services" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"icon_source" "enum_services_icon_source" DEFAULT 'lucide',
  	"icon_lucide" "enum_services_icon_lucide" DEFAULT 'BookOpen',
  	"icon_custom_svg_id" integer,
  	"theme_primary_color" varchar,
  	"theme_secondary_color" varchar,
  	"theme_accent_color" varchar,
  	"theme_logo_id" integer,
  	"search_defaults_placeholder" varchar,
  	"search_defaults_include_older_versions" boolean DEFAULT false,
  	"search_defaults_results_limit" numeric DEFAULT 20,
  	"latest_version_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "doc_versions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"service_id" integer NOT NULL,
  	"version" varchar NOT NULL,
  	"default_page_slug" varchar NOT NULL,
  	"version_key" varchar,
  	"is_prerelease" boolean DEFAULT false,
  	"status" "enum_doc_versions_status" DEFAULT 'draft' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "doc_page_groups" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"service_id" integer NOT NULL,
  	"version_id" integer NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"description" varchar,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "doc_pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"service_id" integer NOT NULL,
  	"version_id" integer NOT NULL,
  	"slug" varchar NOT NULL,
  	"group_id" integer,
  	"title" varchar NOT NULL,
  	"content" jsonb NOT NULL,
  	"status" "enum_doc_pages_status" DEFAULT 'draft' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "redirects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"from" varchar NOT NULL,
  	"to" varchar NOT NULL,
  	"service_id" integer,
  	"version_id" integer,
  	"permanent" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"services_id" integer,
  	"doc_versions_id" integer,
  	"doc_page_groups_id" integer,
  	"doc_pages_id" integer,
  	"redirects_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "docs_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"home_title" varchar,
  	"home_description" varchar,
  	"home_content" jsonb NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services" ADD CONSTRAINT "services_icon_custom_svg_id_media_id_fk" FOREIGN KEY ("icon_custom_svg_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services" ADD CONSTRAINT "services_theme_logo_id_media_id_fk" FOREIGN KEY ("theme_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services" ADD CONSTRAINT "services_latest_version_id_doc_versions_id_fk" FOREIGN KEY ("latest_version_id") REFERENCES "public"."doc_versions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "doc_versions" ADD CONSTRAINT "doc_versions_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "doc_page_groups" ADD CONSTRAINT "doc_page_groups_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "doc_page_groups" ADD CONSTRAINT "doc_page_groups_version_id_doc_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."doc_versions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "doc_pages" ADD CONSTRAINT "doc_pages_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "doc_pages" ADD CONSTRAINT "doc_pages_version_id_doc_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."doc_versions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "doc_pages" ADD CONSTRAINT "doc_pages_group_id_doc_page_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."doc_page_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "redirects" ADD CONSTRAINT "redirects_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "redirects" ADD CONSTRAINT "redirects_version_id_doc_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."doc_versions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_doc_versions_fk" FOREIGN KEY ("doc_versions_id") REFERENCES "public"."doc_versions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_doc_page_groups_fk" FOREIGN KEY ("doc_page_groups_id") REFERENCES "public"."doc_page_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_doc_pages_fk" FOREIGN KEY ("doc_pages_id") REFERENCES "public"."doc_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_redirects_fk" FOREIGN KEY ("redirects_id") REFERENCES "public"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "services_slug_idx" ON "services" USING btree ("slug");
  CREATE INDEX "services_icon_icon_custom_svg_idx" ON "services" USING btree ("icon_custom_svg_id");
  CREATE INDEX "services_theme_theme_logo_idx" ON "services" USING btree ("theme_logo_id");
  CREATE INDEX "services_latest_version_idx" ON "services" USING btree ("latest_version_id");
  CREATE INDEX "services_updated_at_idx" ON "services" USING btree ("updated_at");
  CREATE INDEX "services_created_at_idx" ON "services" USING btree ("created_at");
  CREATE INDEX "doc_versions_service_idx" ON "doc_versions" USING btree ("service_id");
  CREATE INDEX "doc_versions_updated_at_idx" ON "doc_versions" USING btree ("updated_at");
  CREATE INDEX "doc_versions_created_at_idx" ON "doc_versions" USING btree ("created_at");
  CREATE INDEX "doc_page_groups_service_idx" ON "doc_page_groups" USING btree ("service_id");
  CREATE INDEX "doc_page_groups_version_idx" ON "doc_page_groups" USING btree ("version_id");
  CREATE INDEX "doc_page_groups_slug_idx" ON "doc_page_groups" USING btree ("slug");
  CREATE INDEX "doc_page_groups_updated_at_idx" ON "doc_page_groups" USING btree ("updated_at");
  CREATE INDEX "doc_page_groups_created_at_idx" ON "doc_page_groups" USING btree ("created_at");
  CREATE UNIQUE INDEX "service_version_slug_idx" ON "doc_page_groups" USING btree ("service_id","version_id","slug");
  CREATE INDEX "doc_pages_service_idx" ON "doc_pages" USING btree ("service_id");
  CREATE INDEX "doc_pages_version_idx" ON "doc_pages" USING btree ("version_id");
  CREATE INDEX "doc_pages_group_idx" ON "doc_pages" USING btree ("group_id");
  CREATE INDEX "doc_pages_updated_at_idx" ON "doc_pages" USING btree ("updated_at");
  CREATE INDEX "doc_pages_created_at_idx" ON "doc_pages" USING btree ("created_at");
  CREATE UNIQUE INDEX "service_version_slug_1_idx" ON "doc_pages" USING btree ("service_id","version_id","slug");
  CREATE INDEX "redirects_from_idx" ON "redirects" USING btree ("from");
  CREATE INDEX "redirects_service_idx" ON "redirects" USING btree ("service_id");
  CREATE INDEX "redirects_version_idx" ON "redirects" USING btree ("version_id");
  CREATE INDEX "redirects_updated_at_idx" ON "redirects" USING btree ("updated_at");
  CREATE INDEX "redirects_created_at_idx" ON "redirects" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_services_id_idx" ON "payload_locked_documents_rels" USING btree ("services_id");
  CREATE INDEX "payload_locked_documents_rels_doc_versions_id_idx" ON "payload_locked_documents_rels" USING btree ("doc_versions_id");
  CREATE INDEX "payload_locked_documents_rels_doc_page_groups_id_idx" ON "payload_locked_documents_rels" USING btree ("doc_page_groups_id");
  CREATE INDEX "payload_locked_documents_rels_doc_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("doc_pages_id");
  CREATE INDEX "payload_locked_documents_rels_redirects_id_idx" ON "payload_locked_documents_rels" USING btree ("redirects_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "services" CASCADE;
  DROP TABLE "doc_versions" CASCADE;
  DROP TABLE "doc_page_groups" CASCADE;
  DROP TABLE "doc_pages" CASCADE;
  DROP TABLE "redirects" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "docs_settings" CASCADE;
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_services_icon_source";
  DROP TYPE "public"."enum_services_icon_lucide";
  DROP TYPE "public"."enum_doc_versions_status";
  DROP TYPE "public"."enum_doc_pages_status";`)
}
