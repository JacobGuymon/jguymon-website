using Amazon.SimpleEmailV2;
using Amazon.SimpleEmailV2.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;

public class ContactFormSendTests
{
    private static ContactFormRequest ValidRequest() =>
        new("Ada Lovelace", "ada@example.com", "Hello there", null);

    [Fact]
    public async Task SuccessfulSend_ReturnsOkAndCallsSesOnce()
    {
        var ses = new Mock<IAmazonSimpleEmailServiceV2>();
        ses.Setup(s => s.SendEmailAsync(It.IsAny<SendEmailRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SendEmailResponse());

        var result = await ContactFormEndpoint.SendAsync(
            ValidRequest(), ses.Object, "to@example.com", "from@example.com", Mock.Of<ILogger>());

        var statusResult = Assert.IsAssignableFrom<IStatusCodeHttpResult>(result);
        Assert.Equal(200, statusResult.StatusCode);
        ses.Verify(s => s.SendEmailAsync(It.IsAny<SendEmailRequest>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SesThrows_Returns502AndDoesNotThrow()
    {
        var ses = new Mock<IAmazonSimpleEmailServiceV2>();
        ses.Setup(s => s.SendEmailAsync(It.IsAny<SendEmailRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("SES unavailable"));

        var result = await ContactFormEndpoint.SendAsync(
            ValidRequest(), ses.Object, "to@example.com", "from@example.com", Mock.Of<ILogger>());

        var statusResult = Assert.IsAssignableFrom<IStatusCodeHttpResult>(result);
        Assert.Equal(502, statusResult.StatusCode);
    }

    [Fact]
    public void BuildEmailRequest_SetsSenderRecipientReplyToAndContent()
    {
        var request = ValidRequest();

        var emailRequest = ContactFormEndpoint.BuildEmailRequest(request, "to@example.com", "from@example.com");

        Assert.Equal("from@example.com", emailRequest.FromEmailAddress);
        Assert.Equal(["to@example.com"], emailRequest.Destination.ToAddresses);
        Assert.Equal(["ada@example.com"], emailRequest.ReplyToAddresses);
        Assert.Contains(request.Name!, emailRequest.Content.Simple.Subject.Data);
        Assert.Contains(request.Message!, emailRequest.Content.Simple.Body.Text.Data);
    }
}
