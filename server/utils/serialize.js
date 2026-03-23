/**
 * Normalizes Mongoose doc for JSON: adds string `id`, strips __v.
 */
export function toProductJSON(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  const { _id, __v, ...rest } = o;
  return {
    id: String(_id),
    ...rest,
    category:
      rest.category && typeof rest.category === "object" && rest.category._id
        ? {
            id: String(rest.category._id),
            name: rest.category.name,
            slug: rest.category.slug,
            image: rest.category.image,
            description: rest.category.description,
          }
        : rest.category,
  };
}

export function toCategoryJSON(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  const { _id, __v, ...rest } = o;
  return { id: String(_id), ...rest };
}

export function toReviewJSON(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  const { _id, __v, ...rest } = o;
  let user = rest.user;
  if (user && typeof user === "object" && user._id) {
    user = {
      id: String(user._id),
      name: user.name,
      ...(user.email ? { email: user.email } : {}),
    };
  }
  let product = rest.product;
  if (product && typeof product === "object" && product._id) {
    product = { id: String(product._id), name: product.name };
  }
  return {
    id: String(_id),
    ...rest,
    user,
    product,
  };
}
