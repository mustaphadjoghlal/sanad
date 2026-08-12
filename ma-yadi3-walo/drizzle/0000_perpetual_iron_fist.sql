CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(180) NOT NULL,
	`category` varchar(100) NOT NULL,
	`farm` varchar(180) NOT NULL,
	`location` varchar(120) NOT NULL,
	`price` varchar(80) NOT NULL,
	`availability` varchar(120) NOT NULL DEFAULT 'متوفر اليوم',
	`imageUrl` text,
	`imageKey` varchar(500),
	`productStatus` enum('active','hidden') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(160) NOT NULL,
	`description` varchar(320) NOT NULL,
	`icon` varchar(40) NOT NULL DEFAULT 'Truck',
	`sortOrder` int NOT NULL DEFAULT 0,
	`serviceStatus` enum('active','hidden') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` int NOT NULL,
	`announcementText` varchar(255) NOT NULL DEFAULT 'كل كيلو يتم إنقاذه… حكاية خير جديدة',
	`heroBadge` varchar(160) NOT NULL DEFAULT 'محصول طازج، أثر أكبر',
	`heroTitle` varchar(180) NOT NULL DEFAULT 'الخير ما يضيع',
	`heroAccent` varchar(80) NOT NULL DEFAULT 'والو.',
	`heroDescription` text NOT NULL,
	`heroCta` varchar(100) NOT NULL DEFAULT 'تصفح المنتجات',
	`productsTitle` varchar(180) NOT NULL DEFAULT 'اختار الخير القريب منك',
	`servicesLabel` varchar(100) NOT NULL DEFAULT 'خدماتنا',
	`servicesTitle` varchar(180) NOT NULL DEFAULT 'مش مجرد منتجات. منظومة خير.',
	`impactTitle` varchar(180) NOT NULL DEFAULT 'كل حركة صغيرة تزرع فرقًا.',
	`assistantTitle` varchar(180) NOT NULL DEFAULT 'فوكال، معك في كل اختيار',
	`supportEmail` varchar(255) NOT NULL DEFAULT 'maydi3walo@example.com',
	`primaryColor` varchar(16) NOT NULL DEFAULT '#1C6B3C',
	`accentColor` varchar(16) NOT NULL DEFAULT '#D9553F',
	`heroImageUrl` text,
	`heroImageKey` varchar(500),
	`mapImageUrl` text,
	`mapImageKey` varchar(500),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `site_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
