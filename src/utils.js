function convertLeetCodeUrl(url) {
    const baseProblemUrl = "https://leetcode.com/problems/"
    if(!url.endsWith("/")) {
        url += "/"
    }
    const problemMatch = url.match(/problems\/([^/]+)/)

    if (problemMatch){
        const problemSlug = problemMatch[1]
        return `${baseProblemUrl}${problemSlug}/description/`
    } else{
        return url
    }
}
module.exports = {convertLeetCodeUrl}