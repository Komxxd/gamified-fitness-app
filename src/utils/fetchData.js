/**
 * Configuration for the ExerciseDB RapidAPI service.
 * Used for fetching exercise data, including details, search, and filtering.
 */
export const exerciseOptions = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Host': process.env.REACT_APP_RAPIDAPI_HOST,
    'X-RapidAPI-Key': process.env.REACT_APP_RAPIDAPI_KEY,
  },
};

/**
 * Configuration for the YouTube Search and Download RapidAPI service.
 * Used for fetching exercise-related video content.
 */
export const youtubeOptions = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Host': process.env.REACT_APP_YOUTUBE_RAPIDAPI_HOST,
    'X-RapidAPI-Key': process.env.REACT_APP_YOUTUBE_RAPIDAPI_KEY,
  },
};

/**
 * Generic data fetching utility that handles API requests and error cases.
 * @param {string} url - The endpoint URL to fetch data from
 * @param {Object} options - Request configuration options (headers, method, etc.)
 * @returns {Promise<Array|Object>} The fetched data or an empty array if the request fails
 */
export const fetchData = async (url, options) => {
  try {
    console.log('Fetching data from:', url);
    console.log('API Host:', process.env.REACT_APP_RAPIDAPI_HOST);
    console.log('API Key exists:', !!process.env.REACT_APP_RAPIDAPI_KEY);
    
    const response = await fetch(url, options);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Data received:', data ? (Array.isArray(data) ? `Array with ${data.length} items` : 'Object') : 'No data');
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

/**
 * Comprehensive exercise search function that looks through multiple criteria.
 * Searches exercises by name, target muscle, equipment, and body part.
 * Returns unique results by combining all matches.
 * 
 * @param {string} searchTerm - The term to search for
 * @returns {Promise<Array>} Array of unique exercises matching the search criteria
 */
export const searchExercisesByName = async (searchTerm) => {
  try {
    const trimmedTerm = searchTerm.trim().toLowerCase();
    
    if (!trimmedTerm) {
      console.warn('Empty search term provided');
      return [];
    }
    
    // Fetch results from all search endpoints
    const [nameResults, targetResults, equipmentResults, bodyPartResults] = await Promise.all([
      fetchData(`https://exercisedb.p.rapidapi.com/exercises/name/${trimmedTerm}`, exerciseOptions),
      fetchData(`https://exercisedb.p.rapidapi.com/exercises/target/${trimmedTerm}`, exerciseOptions),
      fetchData(`https://exercisedb.p.rapidapi.com/exercises/equipment/${trimmedTerm}`, exerciseOptions),
      fetchData(`https://exercisedb.p.rapidapi.com/exercises/bodyPart/${trimmedTerm}`, exerciseOptions)
    ]);
    
    // Combine and deduplicate results
    const allResults = [
      ...(Array.isArray(nameResults) ? nameResults : []),
      ...(Array.isArray(targetResults) ? targetResults : []),
      ...(Array.isArray(equipmentResults) ? equipmentResults : []),
      ...(Array.isArray(bodyPartResults) ? bodyPartResults : [])
    ];
    
    const uniqueResults = Array.from(
      new Map(allResults.filter(item => item && item.id).map(item => [item.id, item])).values()
    );
    
    console.log(`Found ${uniqueResults.length} unique exercises matching "${trimmedTerm}"`);
    return uniqueResults;
  } catch (error) {
    console.error('Error searching exercises:', error);
    return [];
  }
};

/**
 * Fetches detailed information about a specific exercise by its ID.
 * @param {string} id - The unique identifier of the exercise
 * @returns {Promise<Object>} The exercise details
 * @throws {Error} If the fetch operation fails
 */
export const fetchExerciseById = async (id) => {
  try {
    const response = await fetch(`https://exercisedb.p.rapidapi.com/exercises/exercise/${id}`, exerciseOptions);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching exercise by ID:', error);
    throw error;
  }
};