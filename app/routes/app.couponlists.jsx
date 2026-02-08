import { Page, Card, BlockStack, InlineGrid, Text, Button, ButtonGroup, Divider, Badge, Icon, InlineStack } from "@shopify/polaris";
import { useState, useEffect } from "react";
import { CartIcon, DiscountIcon, EmailIcon, StarFilledIcon } from "@shopify/polaris-icons";

export default function Dashboard() {
	// App features analytics data
	const [analytics, setAnalytics] = useState({
		// Cart Progress Bar
		cartProgressBar: {
			enabled: true,
			totalViews: 2847,
			milestonesReached: 1245,
			conversionRate: "43.7%",
			avgCartValue: "$87.50",
			revenueGenerated: "$108,937"
		},
		// Coupons
		coupons: {
			totalCoupons: 17,
			activeCoupons: 12,
			scheduledCoupons: 3,
			expiredCoupons: 2,
			totalRedemptions: 543,
			revenueFromCoupons: "$23,450",
			topCoupon: "SUMMER30"
		},
		// Email Collection
		emailCollection: {
			totalEmails: 1234,
			thisWeek: 87,
			thisMonth: 342,
			conversionRate: "12.5%",
			growthRate: "+15.3%"
		},
		// Upsells
		upsells: {
			totalRules: 8,
			activeRules: 6,
			impressions: 4521,
			clicks: 892,
			conversions: 234,
			conversionRate: "26.2%",
			revenueGenerated: "$18,720",
			avgUpsellValue: "$80.00"
		},
		// Star Ratings
		starRatings: {
			totalRatings: 456,
			avgRating: 4.6,
			fiveStars: 312,
			fourStars: 98,
			threeStars: 32,
			twoStars: 10,
			oneStars: 4,
			topRatedProduct: "Premium Hoodie"
		},
		// Widgets Performance
		widgets: {
			cartDrawer: {
				views: 5234,
				interactions: 2847,
				engagementRate: "54.4%"
			},
			frequentlyBoughtTogether: {
				impressions: 3421,
				addToCart: 567,
				revenue: "$12,340"
			}
		}
	});

	const [timeRange, setTimeRange] = useState("7days");

	return (
		<Page 
			title="Dashboard Analytics"
			subtitle="Track your app features performance and insights"
		>
			<BlockStack gap="500">
				{/* Time Range Filter */}
				<Card>
					<div style={{ padding: "12px 16px" }}>
						<InlineStack align="space-between" blockAlign="center">
							<Text variant="headingMd" fontWeight="semibold">Performance Overview</Text>
							<ButtonGroup variant="segmented">
								<Button pressed={timeRange === "7days"} onClick={() => setTimeRange("7days")}>Last 7 days</Button>
								<Button pressed={timeRange === "30days"} onClick={() => setTimeRange("30days")}>Last 30 days</Button>
								<Button pressed={timeRange === "90days"} onClick={() => setTimeRange("90days")}>Last 90 days</Button>
							</ButtonGroup>
						</InlineStack>
					</div>
				</Card>

				{/* Key Metrics Summary */}
				<InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
					<Card>
						<div style={{ padding: "16px" }}>
							<BlockStack gap="200">
								<InlineStack align="space-between" blockAlign="start">
									<Icon source={CartIcon} tone="base" />
									<Badge tone="success">+15.3%</Badge>
								</InlineStack>
								<Text variant="headingSm" tone="subdued">Total Revenue</Text>
								<Text variant="heading2xl" fontWeight="bold">$163,447</Text>
								<Text variant="bodySm" tone="subdued">From all features combined</Text>
							</BlockStack>
						</div>
					</Card>
					<Card>
						<div style={{ padding: "16px" }}>
							<BlockStack gap="200">
								<InlineStack align="space-between" blockAlign="start">
									<Icon source={DiscountIcon} tone="base" />
									<Badge tone="info">543 uses</Badge>
								</InlineStack>
								<Text variant="headingSm" tone="subdued">Active Coupons</Text>
								<Text variant="heading2xl" fontWeight="bold">{analytics.coupons.activeCoupons}</Text>
								<Text variant="bodySm" tone="subdued">Revenue: {analytics.coupons.revenueFromCoupons}</Text>
							</BlockStack>
						</div>
					</Card>
					<Card>
						<div style={{ padding: "16px" }}>
							<BlockStack gap="200">
								<InlineStack align="space-between" blockAlign="start">
									<Icon source={EmailIcon} tone="base" />
									<Badge tone="attention">+87 this week</Badge>
								</InlineStack>
								<Text variant="headingSm" tone="subdued">Email Subscribers</Text>
								<Text variant="heading2xl" fontWeight="bold">{analytics.emailCollection.totalEmails}</Text>
								<Text variant="bodySm" tone="subdued">Growth: {analytics.emailCollection.growthRate}</Text>
							</BlockStack>
						</div>
					</Card>
					<Card>
						<div style={{ padding: "16px" }}>
							<BlockStack gap="200">
								<InlineStack align="space-between" blockAlign="start">
									<Icon source={StarFilledIcon} tone="base" />
									<Badge tone="success">{analytics.starRatings.avgRating} ⭐</Badge>
								</InlineStack>
								<Text variant="headingSm" tone="subdued">Product Ratings</Text>
								<Text variant="heading2xl" fontWeight="bold">{analytics.starRatings.totalRatings}</Text>
								<Text variant="bodySm" tone="subdued">Avg rating: {analytics.starRatings.avgRating}/5</Text>
							</BlockStack>
						</div>
					</Card>
				</InlineGrid>

				{/* Cart Progress Bar Analytics */}
				<Card>
					<div style={{ padding: "20px" }}>
						<BlockStack gap="400">
							<InlineStack align="space-between" blockAlign="center">
								<div>
									<Text variant="headingLg" fontWeight="bold">Cart Progress Bar</Text>
									<Text variant="bodySm" tone="subdued">Milestone-based incentives performance</Text>
								</div>
								<Badge tone="success">Active</Badge>
							</InlineStack>
							<InlineGrid columns={{ xs: 1, sm: 2, md: 5 }} gap="400">
								<div>
									<Text variant="bodySm" tone="subdued">Total Views</Text>
									<Text variant="headingLg" fontWeight="semibold">{analytics.cartProgressBar.totalViews}</Text>
								</div>
								<div>
									<Text variant="bodySm" tone="subdued">Milestones Reached</Text>
									<Text variant="headingLg" fontWeight="semibold">{analytics.cartProgressBar.milestonesReached}</Text>
								</div>
								<div>
									<Text variant="bodySm" tone="subdued">Conversion Rate</Text>
									<Text variant="headingLg" fontWeight="semibold" tone="success">{analytics.cartProgressBar.conversionRate}</Text>
								</div>
								<div>
									<Text variant="bodySm" tone="subdued">Avg Cart Value</Text>
									<Text variant="headingLg" fontWeight="semibold">{analytics.cartProgressBar.avgCartValue}</Text>
								</div>
								<div>
									<Text variant="bodySm" tone="subdued">Revenue Generated</Text>
									<Text variant="headingLg" fontWeight="semibold" tone="success">{analytics.cartProgressBar.revenueGenerated}</Text>
								</div>
							</InlineGrid>
						</BlockStack>
					</div>
				</Card>

				{/* Coupons & Upsells Row */}
				<InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
					{/* Coupons Analytics */}
					<Card>
						<div style={{ padding: "20px" }}>
							<BlockStack gap="400">
								<InlineStack align="space-between" blockAlign="center">
									<div>
										<Text variant="headingMd" fontWeight="bold">Coupons</Text>
										<Text variant="bodySm" tone="subdued">Discount codes performance</Text>
									</div>
									<Button variant="plain" onClick={() => window.location.href = '/app/couponlist'}>View all →</Button>
								</InlineStack>
								<InlineGrid columns={2} gap="300">
									<div>
										<Text variant="bodySm" tone="subdued">Total Coupons</Text>
										<Text variant="headingLg" fontWeight="semibold">{analytics.coupons.totalCoupons}</Text>
									</div>
									<div>
										<Text variant="bodySm" tone="subdued">Active</Text>
										<Text variant="headingLg" fontWeight="semibold" tone="success">{analytics.coupons.activeCoupons}</Text>
									</div>
									<div>
										<Text variant="bodySm" tone="subdued">Redemptions</Text>
										<Text variant="headingLg" fontWeight="semibold">{analytics.coupons.totalRedemptions}</Text>
									</div>
									<div>
										<Text variant="bodySm" tone="subdued">Revenue</Text>
										<Text variant="headingLg" fontWeight="semibold" tone="success">{analytics.coupons.revenueFromCoupons}</Text>
									</div>
								</InlineGrid>
								<div style={{ padding: "12px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
									<Text variant="bodySm" fontWeight="semibold">Top Performing: {analytics.coupons.topCoupon}</Text>
								</div>
							</BlockStack>
						</div>
					</Card>

					{/* Upsells Analytics */}
					<Card>
						<div style={{ padding: "20px" }}>
							<BlockStack gap="400">
								<InlineStack align="space-between" blockAlign="center">
									<div>
										<Text variant="headingMd" fontWeight="bold">Upsell Rules</Text>
										<Text variant="bodySm" tone="subdued">Product recommendations</Text>
									</div>
									<Button variant="plain" onClick={() => window.location.href = '/app/upsell'}>Manage →</Button>
								</InlineStack>
								<InlineGrid columns={2} gap="300">
									<div>
										<Text variant="bodySm" tone="subdued">Active Rules</Text>
										<Text variant="headingLg" fontWeight="semibold">{analytics.upsells.activeRules}</Text>
									</div>
									<div>
										<Text variant="bodySm" tone="subdued">Impressions</Text>
										<Text variant="headingLg" fontWeight="semibold">{analytics.upsells.impressions}</Text>
									</div>
									<div>
										<Text variant="bodySm" tone="subdued">Conversions</Text>
										<Text variant="headingLg" fontWeight="semibold" tone="success">{analytics.upsells.conversions}</Text>
									</div>
									<div>
										<Text variant="bodySm" tone="subdued">Revenue</Text>
										<Text variant="headingLg" fontWeight="semibold" tone="success">{analytics.upsells.revenueGenerated}</Text>
									</div>
								</InlineGrid>
								<div style={{ padding: "12px", backgroundColor: "#f0f9ff", borderRadius: "8px" }}>
									<Text variant="bodySm" fontWeight="semibold">Conversion Rate: {analytics.upsells.conversionRate}</Text>
								</div>
							</BlockStack>
						</div>
					</Card>
				</InlineGrid>

				{/* Email & Star Ratings Row */}
				<InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
					{/* Email Collection */}
					<Card>
						<div style={{ padding: "20px" }}>
							<BlockStack gap="400">
								<div>
									<Text variant="headingMd" fontWeight="bold">Email Collection</Text>
									<Text variant="bodySm" tone="subdued">Subscriber growth tracking</Text>
								</div>
								<InlineGrid columns={3} gap="300">
									<div>
										<Text variant="bodySm" tone="subdued">This Week</Text>
										<Text variant="headingLg" fontWeight="semibold">{analytics.emailCollection.thisWeek}</Text>
									</div>
									<div>
										<Text variant="bodySm" tone="subdued">This Month</Text>
										<Text variant="headingLg" fontWeight="semibold">{analytics.emailCollection.thisMonth}</Text>
									</div>
									<div>
										<Text variant="bodySm" tone="subdued">Total</Text>
										<Text variant="headingLg" fontWeight="semibold">{analytics.emailCollection.totalEmails}</Text>
									</div>
								</InlineGrid>
								<div style={{ display: "flex", gap: "12px" }}>
									<div style={{ flex: 1, padding: "12px", backgroundColor: "#ecfdf5", borderRadius: "8px" }}>
										<Text variant="bodySm" fontWeight="semibold">Conversion: {analytics.emailCollection.conversionRate}</Text>
									</div>
									<div style={{ flex: 1, padding: "12px", backgroundColor: "#f0fdf4", borderRadius: "8px" }}>
										<Text variant="bodySm" fontWeight="semibold">Growth: {analytics.emailCollection.growthRate}</Text>
									</div>
								</div>
							</BlockStack>
						</div>
					</Card>

					{/* Star Ratings */}
					<Card>
						<div style={{ padding: "20px" }}>
							<BlockStack gap="400">
								<div>
									<Text variant="headingMd" fontWeight="bold">Star Ratings</Text>
									<Text variant="bodySm" tone="subdued">Product review analytics</Text>
								</div>
								<div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
									<div>
										<Text variant="heading3xl" fontWeight="bold">{analytics.starRatings.avgRating}</Text>
										<Text variant="bodySm" tone="subdued">⭐⭐⭐⭐⭐</Text>
									</div>
									<div style={{ flex: 1 }}>
										<BlockStack gap="100">
											{[
												{ stars: 5, count: analytics.starRatings.fiveStars },
												{ stars: 4, count: analytics.starRatings.fourStars },
												{ stars: 3, count: analytics.starRatings.threeStars },
												{ stars: 2, count: analytics.starRatings.twoStars },
												{ stars: 1, count: analytics.starRatings.oneStars }
											].map(rating => (
												<div key={rating.stars} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
													<Text variant="bodySm" tone="subdued">{rating.stars}⭐</Text>
													<div style={{ flex: 1, height: "6px", backgroundColor: "#e5e7eb", borderRadius: "3px", overflow: "hidden" }}>
														<div style={{ 
															width: `${(rating.count / analytics.starRatings.totalRatings * 100)}%`, 
															height: "100%", 
															backgroundColor: "#fbbf24",
															transition: "width 0.3s"
														}} />
													</div>
													<Text variant="bodySm" tone="subdued">{rating.count}</Text>
												</div>
											))}
										</BlockStack>
									</div>
								</div>
								<div style={{ padding: "12px", backgroundColor: "#fef3c7", borderRadius: "8px" }}>
									<Text variant="bodySm" fontWeight="semibold">Top Rated: {analytics.starRatings.topRatedProduct}</Text>
								</div>
							</BlockStack>
						</div>
					</Card>
				</InlineGrid>

				{/* Widgets Performance */}
				<Card>
					<div style={{ padding: "20px" }}>
						<BlockStack gap="400">
							<div>
								<Text variant="headingLg" fontWeight="bold">Widgets Performance</Text>
								<Text variant="bodySm" tone="subdued">Engagement and interaction metrics</Text>
							</div>
							<InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
								<div style={{ padding: "16px", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
									<BlockStack gap="300">
										<Text variant="headingMd" fontWeight="semibold">Cart Drawer</Text>
										<InlineGrid columns={3} gap="200">
											<div>
												<Text variant="bodySm" tone="subdued">Views</Text>
												<Text variant="headingMd" fontWeight="semibold">{analytics.widgets.cartDrawer.views}</Text>
											</div>
											<div>
												<Text variant="bodySm" tone="subdued">Interactions</Text>
												<Text variant="headingMd" fontWeight="semibold">{analytics.widgets.cartDrawer.interactions}</Text>
											</div>
											<div>
												<Text variant="bodySm" tone="subdued">Engagement</Text>
												<Text variant="headingMd" fontWeight="semibold" tone="success">{analytics.widgets.cartDrawer.engagementRate}</Text>
											</div>
										</InlineGrid>
									</BlockStack>
								</div>
								<div style={{ padding: "16px", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
									<BlockStack gap="300">
										<Text variant="headingMd" fontWeight="semibold">Frequently Bought Together</Text>
										<InlineGrid columns={3} gap="200">
											<div>
												<Text variant="bodySm" tone="subdued">Impressions</Text>
												<Text variant="headingMd" fontWeight="semibold">{analytics.widgets.frequentlyBoughtTogether.impressions}</Text>
											</div>
											<div>
												<Text variant="bodySm" tone="subdued">Add to Cart</Text>
												<Text variant="headingMd" fontWeight="semibold">{analytics.widgets.frequentlyBoughtTogether.addToCart}</Text>
											</div>
											<div>
												<Text variant="bodySm" tone="subdued">Revenue</Text>
												<Text variant="headingMd" fontWeight="semibold" tone="success">{analytics.widgets.frequentlyBoughtTogether.revenue}</Text>
											</div>
										</InlineGrid>
									</BlockStack>
								</div>
							</InlineGrid>
						</BlockStack>
					</div>
				</Card>

				{/* Quick Actions */}
				<Card>
					<div style={{ padding: "20px" }}>
						<BlockStack gap="300">
							<Text variant="headingMd" fontWeight="semibold">Quick Actions</Text>
							<InlineStack gap="300" wrap>
								<Button onClick={() => window.location.href = '/app/couponlist'}>Manage Coupons</Button>
								<Button onClick={() => window.location.href = '/app/upsell'}>Create Upsell</Button>
								<Button onClick={() => window.location.href = '/app/CartProgressBar'}>Configure Progress Bar</Button>
								<Button onClick={() => window.location.href = '/app/widgets'}>Manage Widgets</Button>
								<Button onClick={() => window.location.href = '/app/customizeUI'}>Customize UI</Button>
							</InlineStack>
						</BlockStack>
					</div>
				</Card>
			</BlockStack>
		</Page>
	);
}
