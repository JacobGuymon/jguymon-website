public class ContactFormValidationTests
{
    private static ContactFormRequest ValidRequest() =>
        new("Ada Lovelace", "ada@example.com", "Hello there", null);

    [Fact]
    public void ValidRequest_ReturnsNoErrors()
    {
        var errors = ContactFormEndpoint.ValidateRequest(ValidRequest());

        Assert.Empty(errors);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void MissingName_ReturnsError(string? name)
    {
        var request = ValidRequest() with { Name = name };

        var errors = ContactFormEndpoint.ValidateRequest(request);

        Assert.Contains(errors, e => e.Contains("Name"));
    }

    [Theory]
    [InlineData("Ada\r\nBcc: spam@evil.com")]
    [InlineData("Ada\nLovelace")]
    [InlineData("Ada\rLovelace")]
    public void NameContainingCarriageReturnOrNewline_ReturnsError(string name)
    {
        var request = ValidRequest() with { Name = name };

        var errors = ContactFormEndpoint.ValidateRequest(request);

        Assert.Contains(errors, e => e.Contains("Name"));
    }

    [Fact]
    public void NameOver200Characters_ReturnsError()
    {
        var request = ValidRequest() with { Name = new string('a', 201) };

        var errors = ContactFormEndpoint.ValidateRequest(request);

        Assert.Contains(errors, e => e.Contains("Name"));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("not-an-email")]
    public void InvalidEmail_ReturnsError(string? email)
    {
        var request = ValidRequest() with { Email = email };

        var errors = ContactFormEndpoint.ValidateRequest(request);

        Assert.Contains(errors, e => e.Contains("email"));
    }

    [Fact]
    public void EmailOver320Characters_ReturnsError()
    {
        var longLocalPart = new string('a', 315);
        var request = ValidRequest() with { Email = $"{longLocalPart}@example.com" };

        var errors = ContactFormEndpoint.ValidateRequest(request);

        Assert.Contains(errors, e => e.Contains("email"));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void MissingMessage_ReturnsError(string? message)
    {
        var request = ValidRequest() with { Message = message };

        var errors = ContactFormEndpoint.ValidateRequest(request);

        Assert.Contains(errors, e => e.Contains("Message"));
    }

    [Fact]
    public void MessageOver5000Characters_ReturnsError()
    {
        var request = ValidRequest() with { Message = new string('a', 5001) };

        var errors = ContactFormEndpoint.ValidateRequest(request);

        Assert.Contains(errors, e => e.Contains("Message"));
    }

    [Fact]
    public void AllFieldsInvalid_ReturnsOneErrorPerField()
    {
        var request = new ContactFormRequest(null, null, null, null);

        var errors = ContactFormEndpoint.ValidateRequest(request);

        Assert.Equal(3, errors.Count);
    }
}
