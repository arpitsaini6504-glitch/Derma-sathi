from typing import List
from app.schemas.wellness import (
    WellnessGuidanceRequest,
    LifestyleGuidanceResponse,
    HerbGuidance
)

HERB_KNOWLEDGE = {
    "neem": HerbGuidance(
        herb_name="Neem",
        sanskrit_name="Nimba (Azadirachta indica)",
        skin_benefits="Kaphahara and Pittahara, traditionally utilized for its purifying, antimicrobial, and soothing qualities in inflammatory blemishes.",
        usage_guidance="Diluted cold-pressed oil or standardized topical formulations. Always perform an elbow patch test first.",
        safety_precautions="Do not ingest raw concentrated extracts without supervision. Avoid contact with open wounds or eyes."
    ),
    "turmeric": HerbGuidance(
        herb_name="Turmeric",
        sanskrit_name="Haridra (Curcuma longa)",
        skin_benefits="Rich in curcumin, widely recognized in both traditional Ayurvedic medicine and modern dermatology for antioxidant and mild anti-inflammatory properties.",
        usage_guidance="Supportive culinary use with black pepper, or mild paste mixed with soothing yogurt/rose water.",
        safety_precautions="May temporarily stain clothing and lighter skin tones. Discontinue if contact irritation occurs."
    ),
    "manjistha": HerbGuidance(
        herb_name="Indian Madder",
        sanskrit_name="Manjistha (Rubia cordifolia)",
        skin_benefits="Classical Pitta-pacifying herb prized in Charaka Samhita as a blood-clarifying (Varnya) agent for even skin tone.",
        usage_guidance="Often consumed as classical decoction under certified Vaidya guidance or applied in traditional Lepas.",
        safety_precautions="Ensure source authenticity; consume only certified medicinal formulations."
    ),
    "aloe": HerbGuidance(
        herb_name="Aloe Vera",
        sanskrit_name="Kumari (Aloe barbadensis)",
        skin_benefits="Deeply hydrating, cooling (Sheeta virya), and accelerates re-epithelialization of superficial barrier irritation.",
        usage_guidance="Apply fresh inner leaf gel or pure formulation directly to cleansed, intact skin.",
        safety_precautions="Avoid using latex portion (yellow sap beneath the leaf rind) as it can cause irritant dermatitis."
    )
}

class WellnessService:
    @staticmethod
    def get_guidance(req: WellnessGuidanceRequest) -> LifestyleGuidanceResponse:
        concern = req.skin_concern.lower().strip()
        season = (req.season or "autumn").lower()

        if "dry" in concern or "flake" in concern:
            dosha = "Vata predominance (Ruksha / dry qualities)"
            diet = [
                "Incorporate warm, nourishing foods such as mung dal khichdi, cooked root vegetables, and healthy fats (A2 cow's ghee).",
                "Stay hydrated with warm water and herbal teas (licorice, fennel); avoid cold iced beverages.",
                "Reduce intake of excessive dry crackers, astringent salads, and caffeine."
            ]
            lifestyle = [
                "Abhyanga (gentle daily self-massage) with cold-pressed sesame or sweet almond oil before warm showers.",
                "Maintain consistent sleep schedules (retire before 10:30 PM) to reduce nervous system stress.",
                "Use a gentle indoor humidifier during dry colder weather."
            ]
            herbs = [HERB_KNOWLEDGE["aloe"], HERB_KNOWLEDGE["turmeric"]]

        elif "red" in concern or "heat" in concern or "itch" in concern:
            dosha = "Pitta predominance (Teekshna / sharp & Ushna / hot qualities)"
            diet = [
                "Prioritize cooling foods: sweet fruits (pomegranate, sweet melons), coconut water, cucumber, and coriander seeds.",
                "Minimize pungent, sour, and overly salty foods (deep-fried snacks, chilies, vinegar, alcohol).",
                "Incorporate soaked raisins and fennel-infused water in the morning."
            ]
            lifestyle = [
                "Avoid peak midday sun exposure (11:00 AM - 3:00 PM).",
                "Engage in calming exercises such as Sheetali pranayama and gentle yoga rather than high-intensity overheated workouts.",
                "Apply pure rose water mists to soothe flushed facial skin."
            ]
            herbs = [HERB_KNOWLEDGE["neem"], HERB_KNOWLEDGE["manjistha"], HERB_KNOWLEDGE["aloe"]]

        else:  # Acne, oiliness, congestion
            dosha = "Kapha-Pitta combination (Snigdha / oily & Kleda / accumulation)"
            diet = [
                "Emphasize light, bitter, and astringent foods: leafy greens (spinach, methi), barley, and digestive spices (cumin, ginger).",
                "Eliminate heavy dairy products, sweetened confectioneries, and processed oils.",
                "Drink warm water infused with a slice of fresh ginger."
            ]
            lifestyle = [
                "Wash face twice daily with a mild, soap-free gentle cleanser; do not over-strip with harsh scrubs.",
                "Maintain regular physical movement to support lymphatic circulation and perspiration.",
                "Change pillowcases twice weekly to prevent bacterial and sebum transfer."
            ]
            herbs = [HERB_KNOWLEDGE["neem"], HERB_KNOWLEDGE["turmeric"]]

        prevention = [
            "Always patch-test any traditional herbal preparation on your inner forearm 24 hours prior to facial use.",
            "Combine holistic lifestyle modifications with standard clinical sun protection (broad-spectrum SPF 30+).",
            "Consult a qualified healthcare provider if symptoms persist or worsen."
        ]

        return LifestyleGuidanceResponse(
            concern_analysis=f"Evaluation for concern: '{req.skin_concern}' during the {season} season.",
            ayurvedic_perspective=f"Associated with {dosha}. Emphasizing balance through diet, daily rhythm (Dinacharya), and seasonal care (Ritucharya).",
            dietary_recommendations=diet,
            lifestyle_practices=lifestyle,
            traditional_topical_care=herbs,
            evidence_based_prevention=prevention
        )
