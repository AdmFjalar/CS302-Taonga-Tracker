namespace TaongaTrackerAPI.Models;

public class FamilyMember
{
    private string FamilyMemberId;
    private string? UserId;
    private string? FirstName;
    private List<string>? MiddleNames;
    private string? LastName;
    private DateTime? DateOfBirth;
    private DateTime? DateOfDeath;
    private string? Gender;
    private List<string>? ParentsIds;
    private List<string>? ChildrenIds;
    private List<string>? SpouseIds;
    private List<string>? SiblingIds;
    private string? Occupation;
    private string? PlaceOfBirth;
    private string? PlaceOfDeath;
    private string? Nationality;
    private string? Religion;
    private string? MaritalStatus;
    private string? RelationshipType;
    private string? ProfilePictureUrl;

    public FamilyMember(
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
    )
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

    public FamilyMember(FamilyMemberDto dto)
        : this(
            dto.FamilyMemberId,
            dto.UserId,
            dto.FirstName,
            dto.MiddleNames,
            dto.LastName,
            dto.DateOfBirth,
            dto.DateOfDeath,
            dto.Gender,
            dto.ParentsIds,
            dto.ChildrenIds,
            dto.SpouseIds,
            dto.SiblingIds,
            dto.Occupation,
            dto.PlaceOfBirth,
            dto.PlaceOfDeath,
            dto.Nationality,
            dto.Religion,
            dto.MaritalStatus,
            dto.RelationshipType,
            dto.ProfilePictureUrl
        )
    { }

    public string GetFamilyMemberId() => FamilyMemberId;
    public void SetFamilyMemberId(string value) => FamilyMemberId = value;

    public string? GetUserId() => UserId;
    public void SetUserId(string? value) => UserId = value;

    public string? GetFirstName() => FirstName;
    public void SetFirstName(string? value) => FirstName = value;

    public List<string>? GetMiddleNames() => MiddleNames;
    public void SetMiddleNames(List<string>? value) => MiddleNames = value;

    public string? GetLastName() => LastName;
    public void SetLastName(string? value) => LastName = value;

    public DateTime? GetDateOfBirth() => DateOfBirth;
    public void SetDateOfBirth(DateTime? value) => DateOfBirth = value;

    public DateTime? GetDateOfDeath() => DateOfDeath;
    public void SetDateOfDeath(DateTime? value) => DateOfDeath = value;

    public string? GetGender() => Gender;
    public void SetGender(string? value) => Gender = value;

    public List<string>? GetParentsIds() => ParentsIds;
    public void SetParentsIds(List<string>? value) => ParentsIds = value;

    public List<string>? GetChildrenIds() => ChildrenIds;
    public void SetChildrenIds(List<string>? value) => ChildrenIds = value;

    public List<string>? GetSpouseIds() => SpouseIds;
    public void SetSpouseIds(List<string>? value) => SpouseIds = value;

    public List<string>? GetSiblingIds() => SiblingIds;
    public void SetSiblingIds(List<string>? value) => SiblingIds = value;

    public string? GetOccupation() => Occupation;
    public void SetOccupation(string? value) => Occupation = value;

    public string? GetPlaceOfBirth() => PlaceOfBirth;
    public void SetPlaceOfBirth(string? value) => PlaceOfBirth = value;

    public string? GetPlaceOfDeath() => PlaceOfDeath;
    public void SetPlaceOfDeath(string? value) => PlaceOfDeath = value;

    public string? GetNationality() => Nationality;
    public void SetNationality(string? value) => Nationality = value;

    public string? GetReligion() => Religion;
    public void SetReligion(string? value) => Religion = value;

    public string? GetMaritalStatus() => MaritalStatus;
    public void SetMaritalStatus(string? value) => MaritalStatus = value;

    public string? GetRelationshipType() => RelationshipType;
    public void SetRelationshipType(string? value) => RelationshipType = value;

    public string? GetProfilePictureUrl() => ProfilePictureUrl;
    public void SetProfilePictureUrl(string? value) => ProfilePictureUrl = value;
}