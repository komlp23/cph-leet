function compareOutputs(actual, expected) {
    if(actual.trim() === expected.trim()){
        return true
    }else{
        return false
    }
}
module.exports={compareOutputs}