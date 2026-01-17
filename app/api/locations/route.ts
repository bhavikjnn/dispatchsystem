import { NextRequest, NextResponse } from "next/server";
import { STATE_CITIES, STATE_DISTRICTS } from "@/lib/location-data";

// Using Country State City API - Free tier: 100 requests/day
// Get your API key from: https://countrystatecity.in/
const CSC_API_KEY = process.env.CSC_API_KEY;
const CSC_BASE_URL = "https://api.countrystatecity.in/v1";

// Cache for API responses to reduce API calls
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function getCached(key: string) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    return null;
}

function setCache(key: string, data: any) {
    cache.set(key, { data, timestamp: Date.now() });
}

function requireApiKey() {
    if (!CSC_API_KEY || CSC_API_KEY === "your_api_key_here") {
        throw new Error(
            "CSC_API_KEY not configured. Get your free API key from https://countrystatecity.in/",
        );
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const country = searchParams.get("country");
    const state = searchParams.get("state");

    try {
        // Get countries
        if (type === "countries") {
            requireApiKey();
            const cacheKey = "countries";
            const cached = getCached(cacheKey);
            if (cached) {
                return NextResponse.json({ countries: cached });
            }

            const response = await fetch(`${CSC_BASE_URL}/countries`, {
                headers: {
                    "X-CSCAPI-KEY": CSC_API_KEY,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch countries");
            }

            const data = await response.json();
            const countries = data.map((c: any) => c.name).sort();
            setCache(cacheKey, countries);

            return NextResponse.json({ countries });
        }

        // Get states for a country
        if (type === "states" && country) {
            requireApiKey();
            const cacheKey = `states-${country}`;
            const cached = getCached(cacheKey);
            if (cached) {
                return NextResponse.json({ states: cached });
            }

            // First, get country ISO code
            const countriesResponse = await fetch(`${CSC_BASE_URL}/countries`, {
                headers: {
                    "X-CSCAPI-KEY": CSC_API_KEY,
                },
            });

            if (!countriesResponse.ok) {
                throw new Error("Failed to fetch countries");
            }

            const countries = await countriesResponse.json();
            const countryData = countries.find((c: any) => c.name === country);

            if (!countryData) {
                return NextResponse.json({ states: [] });
            }

            // Get states for the country
            const statesResponse = await fetch(
                `${CSC_BASE_URL}/countries/${countryData.iso2}/states`,
                {
                    headers: {
                        "X-CSCAPI-KEY": CSC_API_KEY,
                    },
                },
            );

            if (!statesResponse.ok) {
                throw new Error("Failed to fetch states");
            }

            const statesData = await statesResponse.json();
            const states = statesData.map((s: any) => s.name).sort();
            setCache(cacheKey, states);

            return NextResponse.json({ states });
        }

        // Get cities for a state or all cities when no state is selected
        if (type === "cities") {
            if (!state) {
                // Return all Indian cities only. If a non-India country is explicitly requested, return empty for now.
                if (country && country !== "India") {
                    return NextResponse.json({ cities: [] });
                }

                const allCities = Array.from(
                    new Set(
                        Object.values(STATE_CITIES).reduce<string[]>(
                            (acc, list) => acc.concat(list),
                            [],
                        ),
                    ),
                ).sort();

                return NextResponse.json({ cities: allCities });
            }

            const staticCities = STATE_CITIES[state];
            if (staticCities && staticCities.length > 0) {
                return NextResponse.json({ cities: staticCities });
            }

            requireApiKey();
            const cacheKey = `cities-${state}`;
            const cached = getCached(cacheKey);
            if (cached) {
                return NextResponse.json({ cities: cached });
            }

            // Get country ISO (assuming India for now, can be made dynamic)
            const countryIso = "IN";

            // Get state ISO code
            const statesResponse = await fetch(
                `${CSC_BASE_URL}/countries/${countryIso}/states`,
                {
                    headers: {
                        "X-CSCAPI-KEY": CSC_API_KEY,
                    },
                },
            );

            if (!statesResponse.ok) {
                throw new Error("Failed to fetch states");
            }

            const states = await statesResponse.json();
            const stateData = states.find((s: any) => s.name === state);

            if (!stateData) {
                return NextResponse.json({ cities: [] });
            }

            // Get cities for the state
            const citiesResponse = await fetch(
                `${CSC_BASE_URL}/countries/${countryIso}/states/${stateData.iso2}/cities`,
                {
                    headers: {
                        "X-CSCAPI-KEY": CSC_API_KEY,
                    },
                },
            );

            if (!citiesResponse.ok) {
                throw new Error("Failed to fetch cities");
            }

            const citiesData = await citiesResponse.json();
            const cities = citiesData.map((c: any) => c.name).sort();
            setCache(cacheKey, cities);

            return NextResponse.json({ cities });
        }

        // Get districts for a state or all Indian districts when no state is selected
        if (type === "districts") {
            if (!state) {
                if (country && country !== "India") {
                    return NextResponse.json({ districts: [] });
                }

                const allDistricts = Array.from(
                    new Set(
                        Object.values(STATE_DISTRICTS).reduce<string[]>(
                            (acc, list) => acc.concat(list),
                            [],
                        ),
                    ),
                ).sort();

                return NextResponse.json({ districts: allDistricts });
            }

            const cacheKey = `districts-${state}`;
            const cached = getCached(cacheKey);
            if (cached) {
                return NextResponse.json({ districts: cached });
            }

            const indianDistricts = await getIndianDistricts(state);
            setCache(cacheKey, indianDistricts);

            return NextResponse.json({ districts: indianDistricts });
        }

        return NextResponse.json(
            { error: "Invalid request parameters" },
            { status: 400 },
        );
    } catch (error) {
        console.error("Location API error:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to fetch location data",
            },
            { status: 500 },
        );
    }
}

// Static district data for Indian states (CSC API doesn't provide districts)
async function getIndianDistricts(state: string): Promise<string[]> {
    const districtMap: Record<string, string[]> = {
        "Andhra Pradesh": [
            "Anantapur",
            "Chittoor",
            "East Godavari",
            "Guntur",
            "Krishna",
            "Kurnool",
            "Nellore",
            "Prakasam",
            "Srikakulam",
            "Visakhapatnam",
            "Vizianagaram",
            "West Godavari",
            "YSR Kadapa",
        ],
        "Arunachal Pradesh": [
            "Tawang",
            "West Kameng",
            "East Kameng",
            "Papum Pare",
            "Kurung Kumey",
            "Kra Daadi",
            "Lower Subansiri",
            "Upper Subansiri",
            "West Siang",
            "East Siang",
            "Siang",
            "Upper Siang",
            "Lower Siang",
            "Lower Dibang Valley",
            "Dibang Valley",
            "Anjaw",
            "Lohit",
            "Namsai",
            "Changlang",
            "Tirap",
            "Longding",
        ],
        Assam: [
            "Baksa",
            "Barpeta",
            "Biswanath",
            "Bongaigaon",
            "Cachar",
            "Charaideo",
            "Chirang",
            "Darrang",
            "Dhemaji",
            "Dhubri",
            "Dibrugarh",
            "Dima Hasao",
            "Goalpara",
            "Golaghat",
            "Hailakandi",
            "Hojai",
            "Jorhat",
            "Kamrup",
            "Kamrup Metropolitan",
            "Karbi Anglong",
            "Karimganj",
            "Kokrajhar",
            "Lakhimpur",
            "Majuli",
            "Morigaon",
            "Nagaon",
            "Nalbari",
            "Sivasagar",
            "Sonitpur",
            "South Salmara-Mankachar",
            "Tinsukia",
            "Udalguri",
            "West Karbi Anglong",
        ],
        Bihar: [
            "Araria",
            "Arwal",
            "Aurangabad",
            "Banka",
            "Begusarai",
            "Bhagalpur",
            "Bhojpur",
            "Buxar",
            "Darbhanga",
            "East Champaran",
            "Gaya",
            "Gopalganj",
            "Jamui",
            "Jehanabad",
            "Kaimur",
            "Katihar",
            "Khagaria",
            "Kishanganj",
            "Lakhisarai",
            "Madhepura",
            "Madhubani",
            "Munger",
            "Muzaffarpur",
            "Nalanda",
            "Nawada",
            "Patna",
            "Purnia",
            "Rohtas",
            "Saharsa",
            "Samastipur",
            "Saran",
            "Sheikhpura",
            "Sheohar",
            "Sitamarhi",
            "Siwan",
            "Supaul",
            "Vaishali",
            "West Champaran",
        ],
        Chhattisgarh: [
            "Balod",
            "Baloda Bazar",
            "Balrampur",
            "Bastar",
            "Bemetara",
            "Bijapur",
            "Bilaspur",
            "Dantewada",
            "Dhamtari",
            "Durg",
            "Gariaband",
            "Janjgir-Champa",
            "Jashpur",
            "Kabirdham",
            "Kanker",
            "Kondagaon",
            "Korba",
            "Koriya",
            "Mahasamund",
            "Mungeli",
            "Narayanpur",
            "Raigarh",
            "Raipur",
            "Rajnandgaon",
            "Sukma",
            "Surajpur",
            "Surguja",
        ],
        Goa: ["North Goa", "South Goa"],
        Gujarat: [
            "Ahmedabad",
            "Amreli",
            "Anand",
            "Aravalli",
            "Banaskantha",
            "Bharuch",
            "Bhavnagar",
            "Botad",
            "Chhota Udaipur",
            "Dahod",
            "Dang",
            "Devbhoomi Dwarka",
            "Gandhinagar",
            "Gir Somnath",
            "Jamnagar",
            "Junagadh",
            "Kheda",
            "Kutch",
            "Mahisagar",
            "Mehsana",
            "Morbi",
            "Narmada",
            "Navsari",
            "Panchmahal",
            "Patan",
            "Porbandar",
            "Rajkot",
            "Sabarkantha",
            "Surat",
            "Surendranagar",
            "Tapi",
            "Vadodara",
            "Valsad",
        ],
        Haryana: [
            "Ambala",
            "Bhiwani",
            "Charkhi Dadri",
            "Faridabad",
            "Fatehabad",
            "Gurugram",
            "Hisar",
            "Jhajjar",
            "Jind",
            "Kaithal",
            "Karnal",
            "Kurukshetra",
            "Mahendragarh",
            "Nuh",
            "Palwal",
            "Panchkula",
            "Panipat",
            "Rewari",
            "Rohtak",
            "Sirsa",
            "Sonipat",
            "Yamunanagar",
        ],
        "Himachal Pradesh": [
            "Bilaspur",
            "Chamba",
            "Hamirpur",
            "Kangra",
            "Kinnaur",
            "Kullu",
            "Lahaul and Spiti",
            "Mandi",
            "Shimla",
            "Sirmaur",
            "Solan",
            "Una",
        ],
        Jharkhand: [
            "Bokaro",
            "Chatra",
            "Deoghar",
            "Dhanbad",
            "Dumka",
            "East Singhbhum",
            "Garhwa",
            "Giridih",
            "Godda",
            "Gumla",
            "Hazaribagh",
            "Jamtara",
            "Khunti",
            "Koderma",
            "Latehar",
            "Lohardaga",
            "Pakur",
            "Palamu",
            "Ramgarh",
            "Ranchi",
            "Sahebganj",
            "Seraikela Kharsawan",
            "Simdega",
            "West Singhbhum",
        ],
        Karnataka: [
            "Bagalkot",
            "Ballari",
            "Belagavi",
            "Bengaluru Rural",
            "Bengaluru Urban",
            "Bidar",
            "Chamarajanagar",
            "Chikballapur",
            "Chikkamagaluru",
            "Chitradurga",
            "Dakshina Kannada",
            "Davanagere",
            "Dharwad",
            "Gadag",
            "Hassan",
            "Haveri",
            "Kalaburagi",
            "Kodagu",
            "Kolar",
            "Koppal",
            "Mandya",
            "Mysuru",
            "Raichur",
            "Ramanagara",
            "Shivamogga",
            "Tumakuru",
            "Udupi",
            "Uttara Kannada",
            "Vijayapura",
            "Yadgir",
        ],
        Kerala: [
            "Alappuzha",
            "Ernakulam",
            "Idukki",
            "Kannur",
            "Kasaragod",
            "Kollam",
            "Kottayam",
            "Kozhikode",
            "Malappuram",
            "Palakkad",
            "Pathanamthitta",
            "Thiruvananthapuram",
            "Thrissur",
            "Wayanad",
        ],
        "Madhya Pradesh": [
            "Agar Malwa",
            "Alirajpur",
            "Anuppur",
            "Ashoknagar",
            "Balaghat",
            "Barwani",
            "Betul",
            "Bhind",
            "Bhopal",
            "Burhanpur",
            "Chhatarpur",
            "Chhindwara",
            "Damoh",
            "Datia",
            "Dewas",
            "Dhar",
            "Dindori",
            "Guna",
            "Gwalior",
            "Harda",
            "Hoshangabad",
            "Indore",
            "Jabalpur",
            "Jhabua",
            "Katni",
            "Khandwa",
            "Khargone",
            "Mandla",
            "Mandsaur",
            "Morena",
            "Narsinghpur",
            "Neemuch",
            "Panna",
            "Raisen",
            "Rajgarh",
            "Ratlam",
            "Rewa",
            "Sagar",
            "Satna",
            "Sehore",
            "Seoni",
            "Shahdol",
            "Shajapur",
            "Sheopur",
            "Shivpuri",
            "Sidhi",
            "Singrauli",
            "Tikamgarh",
            "Ujjain",
            "Umaria",
            "Vidisha",
        ],
        Maharashtra: [
            "Ahmednagar",
            "Akola",
            "Amravati",
            "Aurangabad",
            "Beed",
            "Bhandara",
            "Buldhana",
            "Chandrapur",
            "Dhule",
            "Gadchiroli",
            "Gondia",
            "Hingoli",
            "Jalgaon",
            "Jalna",
            "Kolhapur",
            "Latur",
            "Mumbai City",
            "Mumbai Suburban",
            "Nagpur",
            "Nanded",
            "Nandurbar",
            "Nashik",
            "Osmanabad",
            "Palghar",
            "Parbhani",
            "Pune",
            "Raigad",
            "Ratnagiri",
            "Sangli",
            "Satara",
            "Sindhudurg",
            "Solapur",
            "Thane",
            "Wardha",
            "Washim",
            "Yavatmal",
        ],
        Manipur: [
            "Bishnupur",
            "Chandel",
            "Churachandpur",
            "Imphal East",
            "Imphal West",
            "Jiribam",
            "Kakching",
            "Kamjong",
            "Kangpokpi",
            "Noney",
            "Pherzawl",
            "Senapati",
            "Tamenglong",
            "Tengnoupal",
            "Thoubal",
            "Ukhrul",
        ],
        Meghalaya: [
            "East Garo Hills",
            "East Jaintia Hills",
            "East Khasi Hills",
            "North Garo Hills",
            "Ri Bhoi",
            "South Garo Hills",
            "South West Garo Hills",
            "South West Khasi Hills",
            "West Garo Hills",
            "West Jaintia Hills",
            "West Khasi Hills",
        ],
        Mizoram: [
            "Aizawl",
            "Champhai",
            "Kolasib",
            "Lawngtlai",
            "Lunglei",
            "Mamit",
            "Saiha",
            "Serchhip",
            "Hnahthial",
            "Khawzawl",
            "Saitual",
        ],
        Nagaland: [
            "Dimapur",
            "Kiphire",
            "Kohima",
            "Longleng",
            "Mokokchung",
            "Mon",
            "Peren",
            "Phek",
            "Tuensang",
            "Wokha",
            "Zunheboto",
        ],
        Odisha: [
            "Angul",
            "Balangir",
            "Balasore",
            "Bargarh",
            "Bhadrak",
            "Boudh",
            "Cuttack",
            "Deogarh",
            "Dhenkanal",
            "Gajapati",
            "Ganjam",
            "Jagatsinghpur",
            "Jajpur",
            "Jharsuguda",
            "Kalahandi",
            "Kandhamal",
            "Kendrapara",
            "Kendujhar",
            "Khordha",
            "Koraput",
            "Malkangiri",
            "Mayurbhanj",
            "Nabarangpur",
            "Nayagarh",
            "Nuapada",
            "Puri",
            "Rayagada",
            "Sambalpur",
            "Subarnapur",
            "Sundargarh",
        ],
        Punjab: [
            "Amritsar",
            "Barnala",
            "Bathinda",
            "Faridkot",
            "Fatehgarh Sahib",
            "Fazilka",
            "Ferozepur",
            "Gurdaspur",
            "Hoshiarpur",
            "Jalandhar",
            "Kapurthala",
            "Ludhiana",
            "Mansa",
            "Moga",
            "Mohali",
            "Muktsar",
            "Pathankot",
            "Patiala",
            "Rupnagar",
            "Sangrur",
            "Shaheed Bhagat Singh Nagar",
            "Tarn Taran",
        ],
        Rajasthan: [
            "Ajmer",
            "Alwar",
            "Banswara",
            "Baran",
            "Barmer",
            "Bharatpur",
            "Bhilwara",
            "Bikaner",
            "Bundi",
            "Chittorgarh",
            "Churu",
            "Dausa",
            "Dholpur",
            "Dungarpur",
            "Hanumangarh",
            "Jaipur",
            "Jaisalmer",
            "Jalore",
            "Jhalawar",
            "Jhunjhunu",
            "Jodhpur",
            "Karauli",
            "Kota",
            "Nagaur",
            "Pali",
            "Pratapgarh",
            "Rajsamand",
            "Sawai Madhopur",
            "Sikar",
            "Sirohi",
            "Sri Ganganagar",
            "Tonk",
            "Udaipur",
        ],
        Sikkim: ["East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"],
        "Tamil Nadu": [
            "Ariyalur",
            "Chengalpattu",
            "Chennai",
            "Coimbatore",
            "Cuddalore",
            "Dharmapuri",
            "Dindigul",
            "Erode",
            "Kallakurichi",
            "Kanchipuram",
            "Kanyakumari",
            "Karur",
            "Krishnagiri",
            "Madurai",
            "Mayiladuthurai",
            "Nagapattinam",
            "Namakkal",
            "Nilgiris",
            "Perambalur",
            "Pudukkottai",
            "Ramanathapuram",
            "Ranipet",
            "Salem",
            "Sivaganga",
            "Tenkasi",
            "Thanjavur",
            "Theni",
            "Thoothukudi",
            "Tiruchirappalli",
            "Tirunelveli",
            "Tirupathur",
            "Tiruppur",
            "Tiruvallur",
            "Tiruvannamalai",
            "Tiruvarur",
            "Vellore",
            "Viluppuram",
            "Virudhunagar",
        ],
        Telangana: [
            "Adilabad",
            "Bhadradri Kothagudem",
            "Hyderabad",
            "Jagtial",
            "Jangaon",
            "Jayashankar",
            "Jogulamba",
            "Kamareddy",
            "Karimnagar",
            "Khammam",
            "Komaram Bheem",
            "Mahabubabad",
            "Mahbubnagar",
            "Mancherial",
            "Medak",
            "Medchal",
            "Nagarkurnool",
            "Nalgonda",
            "Nirmal",
            "Nizamabad",
            "Peddapalli",
            "Rajanna Sircilla",
            "Rangareddy",
            "Sangareddy",
            "Siddipet",
            "Suryapet",
            "Vikarabad",
            "Wanaparthy",
            "Warangal Rural",
            "Warangal Urban",
            "Yadadri Bhuvanagiri",
        ],
        Tripura: [
            "Dhalai",
            "Gomati",
            "Khowai",
            "North Tripura",
            "Sepahijala",
            "South Tripura",
            "Unakoti",
            "West Tripura",
        ],
        "Uttar Pradesh": [
            "Agra",
            "Aligarh",
            "Ambedkar Nagar",
            "Amethi",
            "Amroha",
            "Auraiya",
            "Ayodhya",
            "Azamgarh",
            "Baghpat",
            "Bahraich",
            "Ballia",
            "Balrampur",
            "Banda",
            "Barabanki",
            "Bareilly",
            "Basti",
            "Bhadohi",
            "Bijnor",
            "Budaun",
            "Bulandshahr",
            "Chandauli",
            "Chitrakoot",
            "Deoria",
            "Etah",
            "Etawah",
            "Farrukhabad",
            "Fatehpur",
            "Firozabad",
            "Gautam Buddha Nagar",
            "Ghaziabad",
            "Ghazipur",
            "Gonda",
            "Gorakhpur",
            "Hamirpur",
            "Hapur",
            "Hardoi",
            "Hathras",
            "Jalaun",
            "Jaunpur",
            "Jhansi",
            "Kannauj",
            "Kanpur Dehat",
            "Kanpur Nagar",
            "Kasganj",
            "Kaushambi",
            "Kushinagar",
            "Lakhimpur Kheri",
            "Lalitpur",
            "Lucknow",
            "Maharajganj",
            "Mahoba",
            "Mainpuri",
            "Mathura",
            "Mau",
            "Meerut",
            "Mirzapur",
            "Moradabad",
            "Muzaffarnagar",
            "Pilibhit",
            "Pratapgarh",
            "Prayagraj",
            "Raebareli",
            "Rampur",
            "Saharanpur",
            "Sambhal",
            "Sant Kabir Nagar",
            "Shahjahanpur",
            "Shamli",
            "Shravasti",
            "Siddharthnagar",
            "Sitapur",
            "Sonbhadra",
            "Sultanpur",
            "Unnao",
            "Varanasi",
        ],
        Uttarakhand: [
            "Almora",
            "Bageshwar",
            "Chamoli",
            "Champawat",
            "Dehradun",
            "Haridwar",
            "Nainital",
            "Pauri Garhwal",
            "Pithoragarh",
            "Rudraprayag",
            "Tehri Garhwal",
            "Udham Singh Nagar",
            "Uttarkashi",
        ],
        "West Bengal": [
            "Alipurduar",
            "Bankura",
            "Birbhum",
            "Cooch Behar",
            "Dakshin Dinajpur",
            "Darjeeling",
            "Hooghly",
            "Howrah",
            "Jalpaiguri",
            "Jhargram",
            "Kalimpong",
            "Kolkata",
            "Malda",
            "Murshidabad",
            "Nadia",
            "North 24 Parganas",
            "Paschim Bardhaman",
            "Paschim Medinipur",
            "Purba Bardhaman",
            "Purba Medinipur",
            "Purulia",
            "South 24 Parganas",
            "Uttar Dinajpur",
        ],
        "Andaman and Nicobar Islands": [
            "Nicobar",
            "North and Middle Andaman",
            "South Andaman",
        ],
        Chandigarh: ["Chandigarh"],
        "Dadra and Nagar Haveli and Daman and Diu": [
            "Dadra and Nagar Haveli",
            "Daman",
            "Diu",
        ],
        Delhi: [
            "Central Delhi",
            "East Delhi",
            "New Delhi",
            "North Delhi",
            "North East Delhi",
            "North West Delhi",
            "Shahdara",
            "South Delhi",
            "South East Delhi",
            "South West Delhi",
            "West Delhi",
        ],
        "Jammu and Kashmir": [
            "Anantnag",
            "Bandipora",
            "Baramulla",
            "Budgam",
            "Doda",
            "Ganderbal",
            "Jammu",
            "Kathua",
            "Kishtwar",
            "Kulgam",
            "Kupwara",
            "Poonch",
            "Pulwama",
            "Rajouri",
            "Ramban",
            "Reasi",
            "Samba",
            "Shopian",
            "Srinagar",
            "Udhampur",
        ],
        Ladakh: ["Kargil", "Leh"],
        Lakshadweep: ["Lakshadweep"],
        Puducherry: ["Karaikal", "Mahe", "Puducherry", "Yanam"],
    };

    return districtMap[state] || [];
}
