import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  values: {
    type: [mongoose.Schema.Types.Mixed], // Cho phép string hoặc object
    default: []
  }
}, {
  timestamps: true
});
optionSchema.post('findOneAndUpdate', async function (doc) {
  if (!doc) return;

  // Lấy option sau update
  const updatedOption = await this.model.findById(doc._id).lean();
  if (!updatedOption) return;

  const oldValues = doc.values;
  const newValues = updatedOption.values;

  const removedValues = oldValues.filter(val => {
    if (val?.name) {
      return !newValues.some(nv => nv.name === val.name);
    }
    return !newValues.includes(val);
  });

  if (removedValues.length === 0) return;

  console.log(`[Option Hook] Removed values in '${doc.key}':`, removedValues);

  const Product = mongoose.model('Product');
  const Variant = mongoose.model('Variant');

  // XỬ LÝ PRODUCT
  const products = await Product.find({
    [`options.${doc.key}`]: { $exists: true }
  });

  for (const product of products) {
    let changed = false;

    let optionValues = product.options.get(doc.key);

    if (!optionValues) continue;

    optionValues = Array.isArray(optionValues) ? optionValues : [optionValues];

    const filteredValues = optionValues.filter(val => {
      if (doc.key === 'color') {
        return !removedValues.some(r => r.name === val.name);
      }
      return !removedValues.includes(val);
    });

    if (filteredValues.length !== optionValues.length) {
      product.options.set(doc.key, filteredValues);
      changed = true;
    }

    if (filteredValues.length === 0) {
      product.options.delete(doc.key);
      changed = true;
    }

    if (changed) {
      await product.save();
      console.log(`[Option Hook] Updated Product ${product._id} after removing option value`);
    }
  }

  // XỬ LÝ VARIANT
  let variantQuery = {};
  if (doc.key === 'color') {
    variantQuery = {
      'color.name': { $in: removedValues.map(v => v.name) }
    };
  } else {
    variantQuery = {
      [doc.key]: { $in: removedValues }
    };
  }

  const variantsToDelete = await Variant.find(variantQuery);

  if (variantsToDelete.length > 0) {
    const ids = variantsToDelete.map(v => v._id);
    await Variant.deleteMany({ _id: { $in: ids } });
    console.log(`[Option Hook] Deleted ${variantsToDelete.length} variants using removed option values`);
  }
});

const Option = mongoose.model('Option', optionSchema);

export default Option;
