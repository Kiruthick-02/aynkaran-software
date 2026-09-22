// backend/routes/catalogRoutes.js
import express from 'express';

export function catalogRoutes(db) {
  const router = express.Router();
  const collection = db.collection('insurance_companies');

  router.get('/public/catalog', async (req, res) => {
    try {
      const companies = await collection
        .find({
          $or: [
            { status: 'Active' },
            { status: 'Temporarily Stopped', websiteVisibility: 'show' },
          ],
        })
        .toArray();

      const websiteCompanies = companies.map((c) => {
        const isFullyActive = c.status === 'Active';
        return {
          id: c._id.toString(),
          name: c.name,
          shortDescription:
            c.address || `${c.name} – trusted partner of Aynkaran Consultants.`,
          description:
            c.address ||
            `${c.name} offers reliable insurance solutions through Aynkaran Consultants.`,
          descriptionPoints: Array.isArray(c.descriptionPoints)
            ? c.descriptionPoints
            : [],
          logo: c.logo || null,
          backgroundImage: c.backgroundImage || null,
          categories: c.insuranceTypes?.length
            ? c.insuranceTypes.map((t) =>
                String(t).replace(/ Insurance$/i, '')
              )
            : [String(c.type || 'Life').replace(/ Insurance$/i, '')],
          claimRatio: c.claimRatio || '98%',
          rating: 4.8,
          isActive: isFullyActive,
          consultationEnabled: isFullyActive,
          websiteVisibility: c.websiteVisibility || 'show',
          status: c.status,
        };
      });

      const websiteProducts = [];
      companies.forEach((c) => {
        const isFullyActive = c.status === 'Active';

        (c.policies || [])
          .filter((p) => p.websiteVisibility !== 'hide')
          .forEach((p) => {
            const features = (p.keyFeatures || [])
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((x) => (typeof x === 'string' ? x : x.text))
              .filter(Boolean);

            const eligibilityCriteria = (p.eligibilityCriteria || [])
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((x) => (typeof x === 'string' ? x : x.text))
              .filter(Boolean);

            websiteProducts.push({
              id: p.id || `${c._id}-${p.name}`,
              title: p.name,
              category: String(
                c.insuranceTypes?.[0] || c.type || 'Life'
              ).replace(/ Insurance$/i, ''),
              description: `Policy scheme under ${c.name}.`,
              features: features.length ? features : [`Offered by ${c.name}`],
              keyFeatures: features,
              benefits: ['Partner product via Aynkaran Consultants'],
              eligibilityCriteria,
              eligibility:
                eligibilityCriteria.join(' · ') ||
                'As per insurer guidelines',
              docsRequired: ['KYC documents as required by insurer'],
              claimProcess: ['Contact Aynkaran Claims Desk for assistance'],
              partnerId: c._id.toString(),
              partnerName: c.name,
              consultationEnabled: isFullyActive,
              logo: c.logo || null,
              brochurePath: p.brochurePath || p.brochure?.path || p.brochureUrl || null,
              brochureFileName: p.brochureFileName || p.brochure?.fileName || null,
            });
          });
      });

      res.json({ companies: websiteCompanies, products: websiteProducts });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}