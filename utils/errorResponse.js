class ErrorResponse extends Error {
    constructor(message, statuCode) {
        super(message);
        this.statuCode = statuCode;
    }
};

module.exports = ErrorResponse;