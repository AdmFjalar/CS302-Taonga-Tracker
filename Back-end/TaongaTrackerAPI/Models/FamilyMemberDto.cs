namespace TaongaTrackerAPI.Models;

public record FamilyMemberDto()
{
    public string FamilyMemberId { get; set; }
    public string? UserId { get; set; }
    public string? FirstName { get; set; }
    public List<string>? MiddleNames { get; set; }
    public string? LastName { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public DateTime? DateOfDeath { get; set; }
    public string? Gender { get; set; }
    public List<string>? ParentsIds { get; set; }
    public List<string>? ChildrenIds { get; set; }
    public List<string>? SpouseIds { get; set; }
    public List<string>? SiblingIds { get; set; }
    public string? Occupation { get; set; }
    public string? PlaceOfBirth { get; set; }
    public string? PlaceOfDeath { get; set; }
    public string? Nationality { get; set; }
    public string? Religion { get; set; }
    public string? MaritalStatus { get; set; }
    public string? RelationshipType { get; set; }
    public string? ProfilePictureUrl { get; set; }

    public FamilyMemberDto(
        string familyMemberId,
        string? userId = null,
        string? firstName = null,
        List<string>? middleNames = null,
        string? lastName = null,
        DateTime? dateOfBirth = null,
        DateTime? dateOfDeath = null,
        string? gender = null,
        List<string>? parentsIds = null,
        List<string>? childrenIds = null,
        List<string>? spouseIds = null,
        List<string>? siblingIds = null,
        string? occupation = null,
        string? placeOfBirth = null,
        string? placeOfDeath = null,
        string? nationality = null,
        string? religion = null,
        string? maritalStatus = null,
        string? relationshipType = null,
        string? profilePictureUrl = null
    ) : this()
    {
        FamilyMemberId = familyMemberId;
        UserId = userId;
        FirstName = firstName;
        MiddleNames = middleNames;
        LastName = lastName;
        DateOfBirth = dateOfBirth;
        DateOfDeath = dateOfDeath;
        Gender = gender;
        ParentsIds = parentsIds;
        ChildrenIds = childrenIds;
        SpouseIds = spouseIds;
        SiblingIds = siblingIds;
        Occupation = occupation;
        PlaceOfBirth = placeOfBirth;
        PlaceOfDeath = placeOfDeath;
        Nationality = nationality;
        Religion = religion;
        MaritalStatus = maritalStatus;
        RelationshipType = relationshipType;
        ProfilePictureUrl = profilePictureUrl;
    }
}