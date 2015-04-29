<html>
	<head>
		<style>
			xh4{
			    display:none;
			}
			xh4:last-of-type{
			    display:block;
			}
			xh3{
			    display:none;
			}
			xh3:last-of-type{
			    display:block;
			}
		</style>
	</head>
	<body>
	<?php
	// Require simple_html_dom.php for traversing the DOM
	require_once 'simple_html_dom.php';
	
	function scrapeLinks() {
		
		// Loop through vendor categories
		$listingDomain = 'https://www.theknot.com';
		$listingUrl = $listingDomain.'/marketplace?city=woburn,+ma';
		$listingOutput = file_get_html($listingUrl);
		$listingLinks = $listingOutput->find("a.vendor-search-link");
		$currentCategory = 0;
		echo "<ul>";
		foreach($listingLinks as $element) {
	       
			// Get Category Link
			$categoryUrl = $listingDomain.$element->href;
			
			// Loop through vendors in a category
			$categoryOutput = file_get_html($categoryUrl."-woburn-ma");
			$categoryName = $categoryOutput->find("#category-name", 0)->plaintext;
			$categoryLinks = $categoryOutput->find(".photo-card a");
			$currentVendor = 0;
			$categoryOutput->clear();
			unset($categoryOutput);
			$currentCategory ++;
			echo "<li><b><p class='category-progress'>CATEGORY: " . $currentCategory . " of " . count($listingLinks) . "</b></li><ul>";
			foreach($categoryLinks as $element) {

				// Temporarily extend time limit
				set_time_limit(300);
				
				// Get Vendor Link
				$vendorUrl = $listingDomain.$element->href;
				//echo "VENDOR: " . $vendorUrl . "<br>";
				
				// Get Vendor Data
				$vendorOutput = file_get_html($vendorUrl);
				$vendorData["category"] = $categoryName;
				$vendorData["name"] = $vendorOutput->find(".vendor-summary h1", 0)->plaintext;
				$vendorData["location"] = $vendorOutput->find(".vendor-summary .vendor-address", 0)->plaintext;
				$vendorData["website"] = $vendorOutput->find(".vendor-summary .vendor-website", 0)->href;
				$vendorData["headline"] = $vendorOutput->find("#about-this-vendor h3", 0)->plaintext;
				$vendorData["description"] = $vendorOutput->find("#about-this-vendor .description", 0)->plaintext;
				$vendorData["stars"] = $vendorOutput->find(".reviews-summary-container > meta", 0)->content;
				$vendorData["reviewsContainer"] = $vendorOutput->find(".review-container");
				foreach($vendorData["reviewsContainer"] as $review) {
					/*echo "<tr>";
					echo "<td>" . $vendorData["category"] . "</td>";
					echo "<td>" . $vendorData["name"] . "</td>";
					echo "<td>" . $vendorData["location"] . "</td>";
					echo "<td>" . $vendorData["website"] . "</td>";
					echo "<td>" . $vendorData["headline"] . "</td>";
					echo "<td>" . $vendorData["description"] . "</td>";
					echo "<td>" . $review->find(".star-rating meta",0)->content . "</td>";
					echo "<td>" . $review->find("h3",0)->plaintext . "</td>";
					echo "<td>" . $review->find("p",0)->plaintext . "</td>";
					echo "</tr>";*/
				}
				$vendorOutput->clear();
				unset($vendorOutput);
	
				$currentVendor ++;
				echo "<li class='vendor-progress'>VENDOR: " . $currentVendor . " of " . count($categoryLinks) . " - " . $vendorData["category"] . " | " . $vendorData["name"] . "</li>";

			}
			echo "</ul>";

		}
		echo "</ul>";

	}
	
	scrapeLinks();
	
	?>
	</body>
</html>