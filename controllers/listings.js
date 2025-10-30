const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({}).lean();
  res.render("./listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("./listings/new.ejs");
};
module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
  let response = await geocodingClient
  .forwardGeocode({
  query: req.body.listing.location,
  limit: 1
})
  .send();

  let url = req.file.path;
  let filename = req.file.filename;
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };

  newListing.geometry = response.body.features[0].geometry;

  let savedListing = await newListing.save();
  console.log(savedListing);
  req.flash("success", "new Listing created!");
  return res.redirect(`/listings`);
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }
  let originalImage=listing.image.url;
  originalImage=originalImage.replace("/upload","/upload/w_250");
  res.render("listings/edit", { listing, originalImage });
};

module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  // Update only if user provided a new image
  if(typeof req.file !== 'undefined'){
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }
  
  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};
// module.exports.updateListing = async (req, res) => {
//   const { id } = req.params;

//   const listing = await Listing.findById(id);

//   // Update simple fields
//   listing.title = req.body.listing.title;
//   listing.description = req.body.listing.description;
//   listing.price = req.body.listing.price;
//   listing.country = req.body.listing.country;
//   listing.location = req.body.listing.location;

//   // Update only the image URL if user provided one
//   if (req.body.listing.image && req.body.listing.image.url) {
//     listing.image.url = req.body.listing.image.url;
//   }

//   await listing.save();
//   req.flash("success", "Listing Updated!");
//   res.redirect(`/listings/${listing._id}`);
// };


module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing deleted!");
  res.redirect("/listings");
};
