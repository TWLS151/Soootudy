max_total = []
danzo_lst = []

for i in range(len(nums)-1):
    for j in range(i+1, len(nums)):
        max_total.append(nums[i] * nums[j])    # 각각 곱해서 리스트에 저장

for num in max_total:
    s = str(num)
    is_increasing = True

    # 2자리가 아니라 n자리까지 생각해서 if문 다시 작성하기
    for i in range(len(s) - 1):
        if s[i] > s[i + 1]:      # 단조 증가 깨지는 순간
            is_increasing = False
            break

    if is_increasing:
        danzo_lst.append(num)   # n자리 모두 통과했을 때만 추가


# max_total 리스트에서 하나씩 꺼내서 각 자리수 비교하는 ..
# 십의 자리 > 일의 자리 : 단조증가 하는 수 아님
# 1. 두 수의 곱을 만든다
# 2. 곱한 결과를 문자열로 변환한다
# 3. 문자열의 각 자리 숫자를 왼쪽부터 비교한다
# 4. 앞자리 > 뒷자리가 나오면 단조 증가 아님
# 5. 끝까지 통과하면 단조 증가 수로 인정
# 6. 단조 증가 수 중 최댓값을 갱신한다

if danzo_lst == [ ]:
    print(f'#{tc} -1')
else:
    print(f'#{tc} {max(danzo_lst)}')```