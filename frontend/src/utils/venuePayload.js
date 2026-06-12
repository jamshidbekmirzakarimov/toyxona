// ---------------------------------------------------------------------------
//  VenueForm yig'gan ma'lumotdan so'rov tanasini quradi.
//   - buildVenueFormData: yangi to'yxona (multipart, rasm bilan) -> POST
//   - buildVenueJson:     tahrirlash (JSON, rasmsiz) -> PUT
//  data = { form, singers, cars, menu, karnay, images }
// ---------------------------------------------------------------------------
const karnayPayload = (karnay) =>
  karnay.enabled ? { available: true, price: Number(karnay.price) || 0 } : null;

export function buildVenueFormData({ form, singers, cars, menu, karnay, images }) {
  const fd = new FormData();
  fd.append('name', form.name);
  fd.append('district', form.district);
  fd.append('address', form.address);
  fd.append('capacity', form.capacity);
  fd.append('price_per_seat', form.price_per_seat);
  fd.append('phone', form.phone);
  fd.append('description', form.description);
  fd.append('singers', JSON.stringify(singers.map((s) => ({ name: s.name, price: Number(s.price) }))));
  fd.append('cars', JSON.stringify(cars.map((c) => ({ brand: c.brand, price: Number(c.price) }))));
  fd.append('menu_items', JSON.stringify(menu.map((m) => m.name)));
  fd.append('karnay_surnay', JSON.stringify(karnayPayload(karnay)));
  // To'yxona galereyasi
  images.forEach((f) => fd.append('images', f));
  // Har bir honanda/mashina rasmi — aniq indeks bilan (singerImage_0, carImage_1, ...)
  singers.forEach((s, i) => {
    if (s.imageFile) fd.append(`singerImage_${i}`, s.imageFile);
  });
  cars.forEach((c, i) => {
    if (c.imageFile) fd.append(`carImage_${i}`, c.imageFile);
  });
  return fd;
}

export function buildVenueJson({ form, singers, cars, menu, karnay }) {
  return {
    name: form.name,
    district: form.district,
    address: form.address,
    capacity: Number(form.capacity),
    price_per_seat: Number(form.price_per_seat),
    phone: form.phone,
    description: form.description,
    singers: singers.map((s) => ({ name: s.name, price: Number(s.price), image_url: s.image_url || null })),
    cars: cars.map((c) => ({ brand: c.brand, price: Number(c.price), image_url: c.image_url || null })),
    menu_items: menu.map((m) => m.name),
    karnay_surnay: karnayPayload(karnay),
  };
}
