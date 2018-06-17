# What is this
This is a quick program that I wrote when last looking for a new apartment. The commute time in the morning and evening are an important piece of information when comparing different apartments.

It uses the [Google Distance API](https://developers.google.com/maps/documentation/distance-matrix/intro) with multiple times, destinations, and commute types. When using [Google Maps](https://www.google.com/maps) directly, only a time range is given and it is time intestive to change addresses, times, and copy the data externally. The underlying API provides additional options to get a best guess, optimistic and pessimistic travel time and will accept multiple addresses.

# Using
To execute this, an API Key, addresses, and commute times should be specified for desired information. It then outputs the information, which can then be pasted into something such as Excel or Numbers to be viewed and filtered.

Reference https://developers.google.com/maps/documentation/distance-matrix/start for API key creation.